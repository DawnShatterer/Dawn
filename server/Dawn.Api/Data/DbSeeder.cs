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
        string[] roles = { "Admin", "Teacher", "Student" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Create/Reset Admin
        var existingAdmin = await userManager.FindByEmailAsync("admin@dawn.com");
        if (existingAdmin == null)
        {
            var adminUser = new ApplicationUser { UserName = "admin@dawn.com", Email = "admin@dawn.com", FullName = "System Admin", Role = "Admin", EmailConfirmed = true };
            var result = await userManager.CreateAsync(adminUser, "Admin@123");
            if (result.Succeeded) await userManager.AddToRoleAsync(adminUser, "Admin");
        }
        else
        {
            // Always force-reset to ensure password is current
            var token = await userManager.GeneratePasswordResetTokenAsync(existingAdmin);
            await userManager.ResetPasswordAsync(existingAdmin, token, "Admin@123");
            existingAdmin.Role = "Admin";
            existingAdmin.EmailConfirmed = true;
            await userManager.UpdateAsync(existingAdmin);
            if (!await userManager.IsInRoleAsync(existingAdmin, "Admin"))
                await userManager.AddToRoleAsync(existingAdmin, "Admin");
        }

        // Create/Reset Teacher
        var existingTeacher = await userManager.FindByEmailAsync("teacher@dawn.com");
        if (existingTeacher == null)
        {
            var teacherUser = new ApplicationUser { UserName = "teacher@dawn.com", Email = "teacher@dawn.com", FullName = "Ramesh Pradhan", Role = "Teacher", EmailConfirmed = true };
            var result = await userManager.CreateAsync(teacherUser, "Teacher@123");
            if (result.Succeeded) await userManager.AddToRoleAsync(teacherUser, "Teacher");
        }
        else
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(existingTeacher);
            await userManager.ResetPasswordAsync(existingTeacher, token, "Teacher@123");
            existingTeacher.Role = "Teacher";
            existingTeacher.EmailConfirmed = true;
            await userManager.UpdateAsync(existingTeacher);
            if (!await userManager.IsInRoleAsync(existingTeacher, "Teacher"))
                await userManager.AddToRoleAsync(existingTeacher, "Teacher");
        }

        // Create/Reset Student
        var existingStudent = await userManager.FindByEmailAsync("student@dawn.com");
        if (existingStudent == null)
        {
            var studentUser = new ApplicationUser { UserName = "student@dawn.com", Email = "student@dawn.com", FullName = "Anjali Gurung", Role = "Student", EmailConfirmed = true };
            var result = await userManager.CreateAsync(studentUser, "Student@123");
            if (result.Succeeded) await userManager.AddToRoleAsync(studentUser, "Student");
        }
        else
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(existingStudent);
            await userManager.ResetPasswordAsync(existingStudent, token, "Student@123");
            existingStudent.Role = "Student";
            existingStudent.EmailConfirmed = true;
            await userManager.UpdateAsync(existingStudent);
            if (!await userManager.IsInRoleAsync(existingStudent, "Student"))
                await userManager.AddToRoleAsync(existingStudent, "Student");
        }
        // Create 10 mock Teachers
        for (int i = 1; i <= 10; i++)
        {
            var email = $"teacher{i}@dawn.com";
            if (await userManager.FindByEmailAsync(email) == null)
            {
                var user = new ApplicationUser { UserName = email, Email = email, FullName = $"Mock Teacher {i}", Role = "Teacher", EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, "Teacher@123");
                if (result.Succeeded) await userManager.AddToRoleAsync(user, "Teacher");
            }
        }

        // Create 10 mock Students
        for (int i = 1; i <= 10; i++)
        {
            var email = $"student{i}@dawn.com";
            if (await userManager.FindByEmailAsync(email) == null)
            {
                var user = new ApplicationUser { UserName = email, Email = email, FullName = $"Mock Student {i}", Role = "Student", EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, "Student@123");
                if (result.Succeeded) await userManager.AddToRoleAsync(user, "Student");
            }
        }
    }
}
