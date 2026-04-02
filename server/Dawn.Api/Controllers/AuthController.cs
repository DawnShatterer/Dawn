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
        // Validate role
        var allowedRoles = new[] { "Student", "Teacher", "Admin" };
        var role = model.Role ?? "Student";

        if (!allowedRoles.Contains(role))
            return BadRequest(new { Message = $"Invalid role. Allowed: {string.Join(", ", allowedRoles)}" });

        var user = new ApplicationUser
        {
            UserName = model.Email,
            Email = model.Email,
            FullName = model.FullName,
            Role = role
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Ensure the role exists in Identity, then assign it
        if (!await _roleManager.RoleExistsAsync(role))
            await _roleManager.CreateAsync(new IdentityRole(role));

        await _userManager.AddToRoleAsync(user, role);

        // Generate Email Verification Token
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5174";
        var verificationLink = $"{frontendUrl}/verify-email?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";
        
        await _emailService.SendEmailAsync(
            user.Email,
            "Verify your Dawn Account",
            $"Welcome to Dawn! Please verify your email address by clicking the link below:\n\n{verificationLink}"
        );

        return Ok(new { Message = "User registered successfully! Please check your email to verify your account." });
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendEmailModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || await _userManager.IsEmailConfirmedAsync(user))
            return Ok(new { Message = "If the email exists and is unverified, a verification link has been sent." });

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5174";
        var verificationLink = $"{frontendUrl}/verify-email?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";
        
        await _emailService.SendEmailAsync(
            user.Email,
            "Verify your Dawn Account",
            $"Please verify your email address by clicking the link below:\n\n{verificationLink}"
        );

        return Ok(new { Message = "If the email exists and is unverified, a verification link has been sent." });
    }

    [HttpGet("verify-email")]
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

    [HttpPost("login")]
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

            // Track engagement
            user.LoginCount++;
            await _userManager.UpdateAsync(user);

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
                user = new { user.Email, user.FullName, user.Role, user.LoginCount, user.ProfilePictureUrl }
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

        user.FullName = model.FullName ?? user.FullName;
        user.NickName = model.NickName ?? user.NickName;
        user.Phone = model.Phone ?? user.Phone;
        user.Location = model.Location ?? user.Location;
        user.Grade = model.Grade ?? user.Grade;

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
            PrefOthers = user.PrefOthers,
            GuideLearn = user.GuideLearn,
            GuideTest = user.GuideTest,
            GuideMock = user.GuideMock
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
        user.GuideLearn = model.GuideLearn;
        user.GuideTest = model.GuideTest;
        user.GuideMock = model.GuideMock;

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
                Audience = new List<string>() { _configuration["Authentication:Google:ClientId"] }
            };
            
            // Verifies the token cryptographically using Google's public keys
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Credential, settings);

            // Check if user exists
            var user = await _userManager.FindByEmailAsync(payload.Email);
            bool isNewUser = false;

            if (user == null)
            {
                // Auto-register as Student
                user = new ApplicationUser
                {
                    UserName = payload.Email,
                    Email = payload.Email,
                    FullName = payload.Name, // Comes directly from their Google profile
                    Role = "Student" // Default role
                };

                // Generate a strong random password since they will solely use Google Auth
                var pwd = Guid.NewGuid().ToString() + "Aa1@";
                var result = await _userManager.CreateAsync(user, pwd);

                if (!result.Succeeded)
                    return BadRequest(new { Message = "Failed to auto-register Google account." });
                
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
                    profilePictureUrl = user.ProfilePictureUrl
                }
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { Message = "Invalid Google authentication token." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "An error occurred during Google authentication." });
        }
    }

    /// <summary>
    /// Get all users (Admin only)
    /// </summary>
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
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
            // Optionally, we could invalidate their token here, but stateless JWTs usually just naturally expire
            // or we add a SecurityStamp validator interval. For now, next login is blocked.
            return Ok(new { Message = "User account has been suspended.", IsSuspended = true });
        }
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

        var certificates = await _context.Certificates
            .Where(c => c.StudentId == studentId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.FileUrl,
                c.CreatedAt
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
            Enrollments = enrollments,
            Certificates = certificates
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
            return Ok(new { Message = "If an account with that email exists, a password reset link has been sent." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5174";
        var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

        await _emailService.SendEmailAsync(
            user.Email,
            "Reset your Dawn Password",
            $"We received a request to reset your password. Click the link below to verify your identity:\n\n{resetLink}\n\nIf you did not request this, please ignore this email."
        );

        return Ok(new { Message = "If an account with that email exists, a password reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return BadRequest(new { Message = "Invalid request." });

        var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { Message = result.Errors.FirstOrDefault()?.Description ?? "Failed to reset password." });

        return Ok(new { Message = "Password has been successfully reset. You can now login with your new password." });
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
}

public class UpdateProfileModel
{
    public string? FullName { get; set; }
    public string? NickName { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Grade { get; set; }
}

public class UpdateSettingsModel
{
    public bool PrefEmailNotif { get; set; }
    public bool PrefInAppNotif { get; set; }
    public bool PrefSessions { get; set; }
    public bool PrefAssignments { get; set; }
    public bool PrefAnnouncements { get; set; }
    public bool PrefOthers { get; set; }
    public bool GuideLearn { get; set; }
    public bool GuideTest { get; set; }
    public bool GuideMock { get; set; }
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