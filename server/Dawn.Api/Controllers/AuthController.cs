using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Google.Apis.Auth;
using Dawn.Core.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Dawn.Core.Common;
using Dawn.Core.Interfaces;
using Dawn.Api.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IFileService _fileService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ApplicationDbContext context,
        IEmailService emailService,
        IFileService fileService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
        _emailService = emailService;
        _fileService = fileService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        // Hard-lock public registrations to "Student" only.
        var role = "Student";

        // Generate a 6-digit confirmation code
        var vCode = new Random().Next(100000, 999999).ToString();

        var user = new ApplicationUser
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName,
            Role = role,
            EmailConfirmed = false,
            EmailVerificationCode = vCode,
            EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15)
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        if (!await _roleManager.RoleExistsAsync(role))
            await _roleManager.CreateAsync(new IdentityRole(role));

        await _userManager.AddToRoleAsync(user, role);

        try
        {
            await _emailService.SendEmailAsync(
                model.Email,
                "Verify your Dawn Account",
                $"Welcome to Dawn! Your 6-digit verification code is: {vCode}\n\nThis code will expire in 15 minutes."
            );
        }
        catch 
        {
            // Log it but let the user proceed to the verification screen
        }

        return Ok(new { Message = "User registered successfully! Please check your email for the verification code.", RequiresVerification = true });
    }

    [HttpPost("bulk-register")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> BulkRegister([FromBody] BulkRegisterModel request)
    {
        // Validate that BatchId is provided
        if (!request.BatchId.HasValue || request.BatchId.Value <= 0)
        {
            return BadRequest(new { Message = "BatchId is required. All students must be assigned to a batch." });
        }

        // Verify the batch exists
        var batch = await _context.Batches.FindAsync(request.BatchId.Value);
        if (batch == null)
        {
            return NotFound(new { Message = "The specified batch does not exist." });
        }

        var results = new List<object>();

        // Find the highest existing numeric ID in the dawn.edu.np domain
        var existingStudents = await _userManager.Users
            .Where(u => u.Email.EndsWith("@dawn.edu.np"))
            .ToListAsync();

        long maxId = 1000000;
        foreach (var user in existingStudents)
        {
            var parts = user.Email!.Split('@');
            if (parts[0].StartsWith("student") && long.TryParse(parts[0].Replace("student", ""), out long id))
            {
                if (id > maxId) maxId = id;
            }
        }

        long nextId = maxId + 1;

        foreach (var name in request.StudentNames)
        {
            if (string.IsNullOrWhiteSpace(name)) continue;

            string generatedEmail = $"student{nextId}@dawn.edu.np";
            
            var user = new ApplicationUser
            {
                UserName = generatedEmail,
                Email = generatedEmail,
                FullName = name.Trim(),
                Role = "Student",
                EmailConfirmed = true, // Batch generated are pre-confirmed
                ForcePasswordChange = true, // Force them to change the default password
                BatchId = request.BatchId
            };

            var result = await _userManager.CreateAsync(user, "dawnuser1090"); // THE REQUIRED DEFAULT PASSWORD

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "Student");
                results.Add(new { Name = name, Email = generatedEmail, Status = "Success" });
                nextId++;
            }
            else
            {
                results.Add(new { Name = name, Errors = result.Errors.Select(e => e.Description) });
            }
        }

        // Generate an Academic Invoice for the entire batch if requested
        if (request.GenerateInvoice && request.InvoiceAmountNpr > 0 && request.BatchId.HasValue)
        {
            var successfulStudentIds = results
                .Where(r => r.GetType().GetProperty("Status")?.GetValue(r)?.ToString() == "Success")
                .Select(r => r.GetType().GetProperty("Email")?.GetValue(r)?.ToString())
                .Where(email => !string.IsNullOrEmpty(email))
                .ToList();

            if (successfulStudentIds.Any())
            {
                var studentUsers = await _userManager.Users
                    .Where(u => successfulStudentIds.Contains(u.Email))
                    .ToListAsync();

                var invoices = studentUsers.Select(student => new SemesterInvoice
                {
                    StudentId = student.Id,
                    Description = $"Semester Tuition - Batch {batch.Name}",
                    AmountNpr = request.InvoiceAmountNpr,
                    DueDate = DateTime.UtcNow.AddMonths(1), // Due in 1 month
                    IsPaid = false
                }).ToList();

                _context.SemesterInvoices.AddRange(invoices);
                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { Message = $"Bulk generation completed. Generated {results.Count(r => r.GetType().GetProperty("Status") != null)} accounts.", Details = results });
    }

    [HttpPost("generate-staff")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GenerateStaff([FromBody] GenerateStaffModel request)
    {
        var role = request.Role; 
        if (role != "Teacher" && role != "Staff")
            return BadRequest(new { Message = "Invalid role. Must be Teacher or Staff." });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { Message = "Full Name is required." });

        var prefix = role == "Teacher" ? "faculty" : "staff";
        var existing = await _userManager.Users
            .Where(u => u.Email.EndsWith("@dawn.edu.np") && u.Email.StartsWith(prefix))
            .ToListAsync();

        long maxId = 1000;
        foreach (var u in existing)
        {
            var parts = u.Email!.Split('@');
            if (parts[0].StartsWith(prefix) && long.TryParse(parts[0].Replace(prefix, ""), out long id))
            {
                if (id > maxId) maxId = id;
            }
        }

        string generatedEmail = $"{prefix}{maxId + 1}@dawn.edu.np";
        
        var user = new ApplicationUser
        {
            UserName = generatedEmail,
            Email = generatedEmail,
            FullName = request.FullName.Trim(),
            Role = role,
            EmailConfirmed = true,
            ForcePasswordChange = true,
        };

        var result = await _userManager.CreateAsync(user, "dawnuser1090");

        if (result.Succeeded)
        {
            if (!await _roleManager.RoleExistsAsync(role))
                await _roleManager.CreateAsync(new IdentityRole(role));
            
            await _userManager.AddToRoleAsync(user, role);
            return Ok(new { Message = $"{role} account generated.", FullName = user.FullName, Email = user.Email, Role = user.Role });
        }

        return BadRequest(result.Errors);
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendEmailModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || await _userManager.IsEmailConfirmedAsync(user))
            return Ok(new { Message = "If the email exists and is unverified, a verification link has been sent." });

        var code = new Random().Next(100000, 999999).ToString();
        user.EmailVerificationCode = code;
        user.EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        await _userManager.UpdateAsync(user);
        
        await _emailService.SendEmailAsync(
            user.Email!,
            "Verify your Dawn Account",
            $"Your new Dawn verification code is: {code}\n\nThis code will expire in 15 minutes."
        );

        return Ok(new { Message = "If the email exists and is unverified, a new code has been sent." });
    }

    [HttpGet("verify-email")] // Legacy token verification
    public async Task<IActionResult> VerifyEmail([FromQuery] string email, [FromQuery] string token)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
            return BadRequest(new { Message = "Invalid email or token." });

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded)
            return Ok(new { Message = "Email verified successfully! You can now login." });

        return BadRequest(new { Message = "Invalid or expired verification token." });
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return BadRequest(new { Message = "Invalid email." });

        if (user.EmailVerificationCode != model.Code)
            return BadRequest(new { Message = "Invalid verification code." });

        if (user.EmailVerificationCodeExpiry < DateTime.UtcNow)
            return BadRequest(new { Message = "Verification code has expired. Please request a new one." });

        // Manually confirm email or generate token and confirm it directly
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var result = await _userManager.ConfirmEmailAsync(user, token);
        
        if (result.Succeeded)
        {
            user.EmailVerificationCode = null;
            user.EmailVerificationCodeExpiry = null;
            await _userManager.UpdateAsync(user);
            return Ok(new { Message = "Email verified successfully! You can now login." });
        }

        return BadRequest(new { Message = "Failed to verify email." });
    }

    [HttpPost("login")]
    [EnableRateLimiting("LoginLimiter")]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);

        if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
        {
            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized(new { Message = "Your account has been suspended by an administrator." });

            if (!await _userManager.IsEmailConfirmedAsync(user))
                return Unauthorized(new { Message = "Please verify your email address to login.", NeedsVerification = true });

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim("FullName", user.FullName ?? ""),
                new Claim(ClaimTypes.Name, user.Email!),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };

            // Add BatchId claim if user has a batch assigned
            if (user.BatchId.HasValue)
            {
                authClaims.Add(new Claim("BatchId", user.BatchId.Value.ToString()));
            }

            // Track engagement
            user.LoginCount++;
            await _userManager.UpdateAsync(user);

            // Create Session Log
            var sessionLog = new StudentSessionLog
            {
                UserId = user.Id,
                StartTime = DateTime.UtcNow,
                Device = Request.Headers["User-Agent"].ToString(),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            _context.StudentSessionLogs.Add(sessionLog);
            await _context.SaveChangesAsync();

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddDays(30),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo,
                sessionId = sessionLog.Id,
                user = new { user.Id, user.Email, user.FullName, user.Role, user.LoginCount, user.ProfilePictureUrl, user.ForcePasswordChange, user.BatchId }
            });
        }

        return Unauthorized(new { Message = "Invalid email or password" });
    }

    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { status = "API is reachable", time = DateTime.Now });

    [HttpPost("debug-login")]
    public async Task<IActionResult> DebugLogin([FromBody] LoginModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) return BadRequest(new { step = "user_lookup", error = $"No user found with email: {model.Email}" });

        var passwordOk = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!passwordOk) return BadRequest(new { step = "password_check", error = "Password hash mismatch", userId = user.Id, role = user.Role });

        return Ok(new { step = "success", email = user.Email, role = user.Role, emailConfirmed = user.EmailConfirmed });
    }

    [HttpPut("profile")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        // Update allowed fields only
        user.FullName = model.FullName ?? user.FullName;
        user.NickName = model.NickName ?? user.NickName;
        user.Phone = model.Phone ?? user.Phone;
        user.Location = model.Location ?? user.Location;
        user.Grade = model.Grade ?? user.Grade;
        
        // Optional: Personal email for notifications
        if (model.PersonalEmail != null)
        {
            // Validate email format if provided
            if (!string.IsNullOrWhiteSpace(model.PersonalEmail))
            {
                var emailRegex = new System.Text.RegularExpressions.Regex(
                    @"^[^@\s]+@[^@\s]+\.[^@\s]+$"
                );
                
                if (!emailRegex.IsMatch(model.PersonalEmail))
                {
                    return BadRequest(new { 
                        message = "Invalid personal email format" 
                    });
                }
            }
            
            user.PersonalEmail = model.PersonalEmail;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim("FullName", user.FullName ?? ""),
            new Claim("NickName", user.NickName ?? ""),
            new Claim("Phone", user.Phone ?? ""),
            new Claim("Location", user.Location ?? ""),
            new Claim("Grade", user.Grade ?? ""),
            new Claim(ClaimTypes.Name, user.Email!),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, user.Role ?? "Student")
        };
        
        // Add PersonalEmail to claims if it exists
        if (!string.IsNullOrWhiteSpace(user.PersonalEmail))
        {
            authClaims.Add(new Claim("PersonalEmail", user.PersonalEmail));
        }
        
        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.Now.AddDays(30),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return Ok(new { 
            Message = "Profile updated!", 
            FullName = user.FullName, 
            NickName = user.NickName,
            Location = user.Location,
            token = new JwtSecurityTokenHandler().WriteToken(token)
        });
    }

    [HttpGet("settings")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetSettings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        return Ok(new
        {
            PrefEmailNotif = user.PrefEmailNotif,
            PrefInAppNotif = user.PrefInAppNotif,
            PrefSessions = user.PrefSessions,
            PrefAssignments = user.PrefAssignments,
            PrefAnnouncements = user.PrefAnnouncements,
            PrefOthers = user.PrefOthers
        });
    }

    [HttpPut("settings")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        // Map boolean flags
        user.PrefEmailNotif = model.PrefEmailNotif;
        user.PrefInAppNotif = model.PrefInAppNotif;
        user.PrefSessions = model.PrefSessions;
        user.PrefAssignments = model.PrefAssignments;
        user.PrefAnnouncements = model.PrefAnnouncements;
        user.PrefOthers = model.PrefOthers;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { Message = "Settings updated successfully" });
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthDto request)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string>() { _configuration["Authentication:Google:ClientId"] ?? "" }
            };
            
            // Verifies the token cryptographically using Google's public keys
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Credential, settings);

            // Check if user exists
            var user = await _userManager.FindByEmailAsync(payload.Email);
            bool isNewUser = false;

            if (user == null)
            {
                // Determine role from frontend preference, default to Student
                var allowedRoles = new[] { "Student", "Teacher" };
                var preferredRole = request.Role ?? "Student";
                var assignedRole = allowedRoles.Contains(preferredRole) ? preferredRole : "Student";

                // Auto-register with the determined role
                user = new ApplicationUser
                {
                    UserName = payload.Email ?? "",
                    Email = payload.Email ?? "",
                    FullName = payload.Name ?? "Dawn User", // Comes directly from their Google profile
                    Role = assignedRole ?? "Student",
                    EmailConfirmed = true // Google accounts are pre-verified
                };

                // Generate a strong random password since they will solely use Google Auth
                var pwd = Guid.NewGuid().ToString() + "Aa1@";
                var result = await _userManager.CreateAsync(user, pwd);

                if (!result.Succeeded)
                    return BadRequest(new { Message = "Failed to auto-register Google account." });

                // Ensure the role exists in Identity, then assign it
                var roleToAssign = assignedRole ?? "Student";
                if (!await _roleManager.RoleExistsAsync(roleToAssign))
                    await _roleManager.CreateAsync(new IdentityRole(roleToAssign));
                await _userManager.AddToRoleAsync(user, roleToAssign);
                
                isNewUser = true;
            }

            // Always increment login count on successful OAuth sign-in
            user.LoginCount++;
            await _userManager.UpdateAsync(user);

            // Generate standard Dawn JWT
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim("FullName", user.FullName ?? ""),
                new Claim(ClaimTypes.Name, user.Email!),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, user.Role ?? "Student")
            };

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddDays(30),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    name = user.FullName,
                    role = user.Role,
                    loginCount = user.LoginCount,
                    isNewUser = isNewUser,
                    profilePictureUrl = user.ProfilePictureUrl,
                    batchId = user.BatchId
                }
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { Message = "Invalid Google authentication token." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An error occurred during Google authentication." });
        }
    }

    /// <summary>
    /// Get all users (Admin only)
    /// </summary>
    [HttpGet("users")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        if (page < 1) page = 1;
        if (limit < 1 || limit > 50) limit = 10;

        var totalCount = await _context.Users.CountAsync();
        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Role,
                u.CreatedAt,
                u.InstitutionName,
                IsSuspended = u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow
            })
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(new PagedResult<object>(users, totalCount, page, limit));
    }

    /// <summary>
    /// GET /api/Auth/all-users?roles=Teacher,Staff
    /// Returns a flat list of users filtered by comma-separated roles. Used by Admin Dashboard.
    /// </summary>
    [HttpGet("all-users")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAllUsersByRole([FromQuery] string roles = "")
    {
        var roleList = roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        
        var query = _context.Users.AsQueryable();
        if (roleList.Length > 0)
            query = query.Where(u => roleList.Contains(u.Role));

        var users = await query
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Role,
                u.CreatedAt,
                IsSuspended = u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow,
                u.ForcePasswordChange
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// POST /api/Auth/admin-reset-password
    /// Admin resets any user's password back to the default and sets ForcePasswordChange = true.
    /// </summary>
    [HttpPost("admin-reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminResetPassword([FromBody] AdminResetPasswordModel model)
    {
        var user = await _userManager.FindByIdAsync(model.UserId);
        if (user == null) return NotFound(new { Message = "User not found." });

        if (user.Role == "Admin")
            return BadRequest(new { Message = "Cannot reset an administrator's password." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, "dawnuser1090");

        if (!result.Succeeded)
            return BadRequest(new { Message = result.Errors.FirstOrDefault()?.Description ?? "Failed to reset password." });

        user.ForcePasswordChange = true;
        await _userManager.UpdateAsync(user);

        return Ok(new { Message = $"Password for {user.FullName} has been reset to default. They will be required to change it on next login." });
    }

    [HttpPost("users/{userId}/toggle-suspend")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleSuspend(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found.");

        if (user.Role == "Admin")
            return BadRequest(new { Message = "Cannot suspend an administrator account." });

        if (await _userManager.IsLockedOutAsync(user))
        {
            await _userManager.SetLockoutEndDateAsync(user, null);
            return Ok(new { Message = "User account has been reactivated.", IsSuspended = false });
        }
        else
        {
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            return Ok(new { Message = "User account has been suspended.", IsSuspended = true });
        }
    }

    /// <summary>
    /// Permanently delete a user account (Admin only)
    /// </summary>
    [HttpDelete("users/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var requestingAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new { Message = "User not found." });

        if (user.Role == "Admin")
            return BadRequest(new { Message = "Cannot delete an administrator account." });

        if (userId == requestingAdminId)
            return BadRequest(new { Message = "You cannot delete your own account." });

        // Delete profile picture if it exists
        if (!string.IsNullOrEmpty(user.ProfilePictureUrl) && !user.ProfilePictureUrl.StartsWith("http"))
            _fileService.DeleteFile(user.ProfilePictureUrl);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { Message = result.Errors.FirstOrDefault()?.Description ?? "Failed to delete user." });

        return Ok(new { Message = $"User '{user.FullName}' has been permanently deleted." });
    }

    /// <summary>
    /// Delete all students who are not assigned to any batch (Admin only)
    /// </summary>
    [HttpDelete("cleanup-unbatched-students")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CleanupUnbatchedStudents()
    {
        // Find all students with no batch assigned
        var unbatchedStudents = await _context.Users
            .Where(u => u.Role == "Student" && u.BatchId == null)
            .ToListAsync();

        if (unbatchedStudents.Count == 0)
        {
            return Ok(new { Message = "No unbatched students found.", DeletedCount = 0, Students = new List<object>() });
        }

        var deletedStudents = new List<object>();

        foreach (var student in unbatchedStudents)
        {
            // Delete profile picture if it exists
            if (!string.IsNullOrEmpty(student.ProfilePictureUrl) && !student.ProfilePictureUrl.StartsWith("http"))
            {
                _fileService.DeleteFile(student.ProfilePictureUrl);
            }

            deletedStudents.Add(new
            {
                Id = student.Id,
                Name = student.FullName,
                Email = student.Email
            });

            await _userManager.DeleteAsync(student);
        }

        return Ok(new
        {
            Message = $"Successfully deleted {deletedStudents.Count} unbatched student(s).",
            DeletedCount = deletedStudents.Count,
            Students = deletedStudents
        });
    }

    /// <summary>
    /// Get list of all students who are not assigned to any batch (Admin only)
    /// </summary>
    [HttpGet("unbatched-students")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUnbatchedStudents()
    {
        var unbatchedStudents = await _context.Users
            .Where(u => u.Role == "Student" && u.BatchId == null)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.CreatedAt
            })
            .OrderBy(u => u.CreatedAt)
            .ToListAsync();

        return Ok(new
        {
            Count = unbatchedStudents.Count,
            Students = unbatchedStudents
        });
    }


    /// <summary>
    /// Get detailed information about a specific student (Admin/Teacher only)
    /// </summary>
    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GetStudentDetails(string studentId)
    {
        var student = await _context.Users.FirstOrDefaultAsync(u => u.Id == studentId);
        if (student == null) return NotFound("Student not found.");

        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.StudentId == studentId)
            .OrderByDescending(e => e.EnrolledAt)
            .Select(e => new
            {
                e.CourseId,
                CourseName = e.Course.Title,
                e.Progress,
                e.EnrolledAt
            })
            .ToListAsync();

        return Ok(new
        {
            Id = student.Id,
            FullName = student.FullName,
            Email = student.Email,
            Role = student.Role,
            CreatedAt = student.CreatedAt,
            InstitutionName = student.InstitutionName,
            Enrollments = enrollments
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
            return Ok(new { Message = "If an account with that email exists, a password reset link has been sent." });

        var code = new Random().Next(100000, 999999).ToString();
        user.PasswordResetCode = code;
        user.PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        await _userManager.UpdateAsync(user);

        await _emailService.SendEmailAsync(
            user.Email ?? "",
            "Dawn Password Reset Code",
            $"We received a request to reset your password.\n\nYour 6-digit verification code is: {code}\n\nIf you did not request this, please ignore this email."
        );

        return Ok(new { Message = "If an account with that email exists, a password reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return BadRequest(new { Message = "Invalid request." });

        if (user.PasswordResetCode != model.Token || user.PasswordResetCodeExpiry < DateTime.UtcNow)
            return BadRequest(new { Message = "Invalid or expired verification code." });

        // Internally generate the identity reset token
        var identityResetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, identityResetToken, model.NewPassword);
        
        if (result.Succeeded)
        {
            user.PasswordResetCode = null;
            user.PasswordResetCodeExpiry = null;
            await _userManager.UpdateAsync(user);
            return Ok(new { Message = "Password has been successfully reset. You can now login with your new password." });
        }

        return BadRequest(new { Message = result.Errors.FirstOrDefault()?.Description ?? "Failed to reset password." });
    }

    [HttpPost("change-password")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new { Message = "User not found" });

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { Message = result.Errors.FirstOrDefault()?.Description ?? "Failed to change password." });

        return Ok(new { Message = "Password changed successfully." });
    }



    [HttpPost("upload-avatar")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        if (file == null || file.Length == 0) return BadRequest(new { Message = "No file uploaded." });

        try
        {
            if (!string.IsNullOrEmpty(user.ProfilePictureUrl) && !user.ProfilePictureUrl.StartsWith("http"))
            {
                _fileService.DeleteFile(user.ProfilePictureUrl);
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var fileUrl = await _fileService.SaveFileAsync(file, allowedExtensions, "avatars");

            user.ProfilePictureUrl = fileUrl;
            await _userManager.UpdateAsync(user);

            return Ok(new { url = fileUrl, message = "Avatar updated successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = $"Failed to upload avatar: {ex.Message}" });
        }
    }

    /// <summary>
    /// Returns a lightweight list of all Teachers (id + name) for Admin course assignment.
    /// </summary>
    [HttpGet("teachers")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetTeachers()
    {
        var teachers = await _context.Users
            .Where(u => u.Role == "Teacher")
            .OrderBy(u => u.FullName)
            .Select(u => new { u.Id, u.FullName })
            .ToListAsync();

        return Ok(teachers);
    }

    [HttpPost("force-change-password")]
    [Authorize]
    public async Task<IActionResult> ForceChangePassword([FromBody] ForceChangePasswordModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new { Message = "User not found." });

        if (!user.ForcePasswordChange)
            return BadRequest(new { Message = "Password change is not required for this account." });

        if (model.NewPassword == "dawnuser1090")
            return BadRequest(new { Message = "You cannot reuse the default system password." });

        // Reset password using Identity's token flow
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);

        if (!result.Succeeded)
            return BadRequest(new { Message = result.Errors.FirstOrDefault()?.Description ?? "Failed to change password." });

        // Clear the flag and update recovery email
        user.ForcePasswordChange = false;
        if (!string.IsNullOrWhiteSpace(model.RecoveryEmail))
        {
            user.RecoveryEmail = model.RecoveryEmail;
        }
        await _userManager.UpdateAsync(user);

        return Ok(new { Message = "Password changed successfully. Welcome to Dawn!" });
    }
}

public class UpdateProfileModel
{
    public string? FullName { get; set; }
    public string? NickName { get; set; }
    // Email is intentionally excluded from DTO to prevent modification attempts
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Grade { get; set; }
    public string? PersonalEmail { get; set; } // Optional field for notifications
}

public class UpdateSettingsModel
{
    public bool PrefEmailNotif { get; set; }
    public bool PrefInAppNotif { get; set; }
    public bool PrefSessions { get; set; }
    public bool PrefAssignments { get; set; }
    public bool PrefAnnouncements { get; set; }
    public bool PrefOthers { get; set; }
}

public class RegisterModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Role { get; set; }
}

public class LoginModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ChangePasswordModel
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ResendEmailModel
{
    public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordModel
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordModel
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class VerifyCodeModel
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class GenerateStaffModel
{
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class BulkRegisterModel
{
    public List<string> StudentNames { get; set; } = new();
    public int? BatchId { get; set; }
    public bool GenerateInvoice { get; set; } = false;
    public decimal InvoiceAmountNpr { get; set; } = 0;
}

public class ForceChangePasswordModel
{
    public string NewPassword { get; set; } = string.Empty;
    public string? RecoveryEmail { get; set; }
}

public class AdminResetPasswordModel
{
    public string UserId { get; set; } = string.Empty;
}