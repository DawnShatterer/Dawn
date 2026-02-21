using Microsoft.AspNetCore.Identity;

namespace Dawn.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? InstitutionName { get; set; } 
    public string Role { get; set; } = "Student"; // Default role
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}