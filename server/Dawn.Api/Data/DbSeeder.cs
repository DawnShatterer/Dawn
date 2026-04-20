using Dawn.Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace Dawn.Api.Data;

public static class DbSeeder
{
    public static async Task SeedRolesAndUsersAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        // Create Roles
        string[] roles = { "Admin", "Staff", "Teacher", "Student" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // ─── Helper: Create or Reset a user ───
        async Task SeedUser(string email, string fullName, string role, string password)
        {
            var existing = await userManager.FindByEmailAsync(email);
            if (existing == null)
            {
                var user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = fullName,
                    Role = role,
                    EmailConfirmed = true
                };
                var result = await userManager.CreateAsync(user, password);
                if (result.Succeeded) await userManager.AddToRoleAsync(user, role);
            }
            else
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(existing);
                await userManager.ResetPasswordAsync(existing, token, password);
                existing.Role = role;
                existing.FullName = fullName;
                await userManager.UpdateAsync(existing);
                if (!await userManager.IsInRoleAsync(existing, role))
                    await userManager.AddToRoleAsync(existing, role);
            }
        }

        // ═══════════════════════════════════════
        // ═══ 1. ADMIN (1) ═══
        // ═══════════════════════════════════════
        await SeedUser("admin1001@dawn.edu.np", "Aayush Gupta", "Admin", "Admin@123");

        // ═══════════════════════════════════════
        // ═══ 2. STAFF (5) ═══
        // ═══════════════════════════════════════
        await SeedUser("staff1001@dawn.edu.np", "Sita Rana", "Staff", "Staff@123");
        await SeedUser("staff1002@dawn.edu.np", "Ravi Thapa", "Staff", "Staff@123");
        await SeedUser("staff1003@dawn.edu.np", "Gita Maharjan", "Staff", "Staff@123");
        await SeedUser("staff1004@dawn.edu.np", "Sunil Shrestha", "Staff", "Staff@123");
        await SeedUser("staff1005@dawn.edu.np", "Anushka Tamang", "Staff", "Staff@123");

        // ═══════════════════════════════════════
        // ═══ 3. TEACHERS (5) ═══
        // ═══════════════════════════════════════
        await SeedUser("teacher1001@dawn.edu.np", "Ramesh Pradhan", "Teacher", "Teacher@123");
        await SeedUser("teacher1002@dawn.edu.np", "Srijana Karki", "Teacher", "Teacher@123");
        await SeedUser("teacher1003@dawn.edu.np", "Bimal Bista", "Teacher", "Teacher@123");
        await SeedUser("teacher1004@dawn.edu.np", "Menuka Neupane", "Teacher", "Teacher@123");
        await SeedUser("teacher1005@dawn.edu.np", "Kiran Gurung", "Teacher", "Teacher@123");

        // ═══════════════════════════════════════
        // ═══ 4. STUDENTS (11) ═══
        // ═══════════════════════════════════════
        await SeedUser("student10001@dawn.edu.np", "Anjali Gurung", "Student", "dawnuser1090");
        await SeedUser("student10002@dawn.edu.np", "Nabin Khadka", "Student", "dawnuser1090");
        await SeedUser("student10003@dawn.edu.np", "Pooja Chaudhary", "Student", "dawnuser1090");
        await SeedUser("student10004@dawn.edu.np", "Dipesh Maharjan", "Student", "dawnuser1090");
        await SeedUser("student10005@dawn.edu.np", "Samiksha Tamang", "Student", "dawnuser1090");
        await SeedUser("student10006@dawn.edu.np", "Aarav Shrestha", "Student", "dawnuser1090");
        await SeedUser("student10007@dawn.edu.np", "Pramila Rai", "Student", "dawnuser1090");
        await SeedUser("student10008@dawn.edu.np", "Bikash Poudel", "Student", "dawnuser1090");
        await SeedUser("student10009@dawn.edu.np", "Sabina Adhikari", "Student", "dawnuser1090");
        await SeedUser("student10010@dawn.edu.np", "Roshan Lama", "Student", "dawnuser1090");
        await SeedUser("student10011@dawn.edu.np", "Nisha Bhattarai", "Student", "dawnuser1090");

        // ═══════════════════════════════════════
        // ═══ 5. SEED DEFAULT INSTITUTION ═══
        // ═══════════════════════════════════════
        var context = scope.ServiceProvider.GetRequiredService<Dawn.Infrastructure.Data.ApplicationDbContext>();
        
        // ═══════════════════════════════════════
        // ═══ 4.5. SEED DEFAULT BATCHES ═══
        // ═══════════════════════════════════════
        if (!context.Batches.Any())
        {
            var b1 = new Batch { Name = "Batch 2026 CS", Description = "Computer Science Batch 2026", StartDate = DateTime.UtcNow, ExpectedGraduationDate = DateTime.UtcNow.AddYears(4) };
            var b2 = new Batch { Name = "Batch 2026 SE", Description = "Software Engineering Batch 2026", StartDate = DateTime.UtcNow, ExpectedGraduationDate = DateTime.UtcNow.AddYears(4) };
            context.Batches.AddRange(b1, b2);
            await context.SaveChangesAsync();
        }

        if (!context.Institutions.Any())
        {
            var defaultInstitution = new Institution
            {
                Name = "Dawn Platform",
                Description = "A Professional Learning Management System",
                LogoUrl = "/logo.png",
                PrimaryColor = "#0d6efd",
                SecondaryColor = "#6c757d",
                CreatedAt = DateTime.UtcNow
            };
            context.Institutions.Add(defaultInstitution);
            await context.SaveChangesAsync();

            // Link Admin to this institution
            var admin = await userManager.FindByEmailAsync("admin1001@dawn.edu.np");
            if (admin != null)
            {
                admin.InstitutionId = defaultInstitution.Id;
                await userManager.UpdateAsync(admin);
            }
        }
    }
}


