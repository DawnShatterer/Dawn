using Microsoft.AspNetCore.Identity;

namespace Dawn.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? InstitutionName { get; set; } 
    public int? InstitutionId { get; set; }
    public Institution? Institution { get; set; }
    
    // --- Academic Structuring ---
    public int? BatchId { get; set; }
    public Batch? Batch { get; set; }
    public bool ForcePasswordChange { get; set; } = false;
    
    public string Role { get; set; } = "Student"; // Default role
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int LoginCount { get; set; } = 0;

    // --- Profile Expansion Properties ---
    public string? ProfilePictureUrl { get; set; }
    public string? NickName { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Grade { get; set; }
    public string? PersonalEmail { get; set; } // Optional personal email separate from institutional email

    // --- Notification & Interface Settings ---
    public bool PrefEmailNotif { get; set; } = true;
    public bool PrefInAppNotif { get; set; } = true;
    public bool PrefSessions { get; set; } = false;
    public bool PrefAssignments { get; set; } = false;
    public bool PrefAnnouncements { get; set; } = false;
    public bool PrefOthers { get; set; } = true;

    // --- Verification Code ---
    public string? EmailVerificationCode { get; set; }
    public DateTime? EmailVerificationCodeExpiry { get; set; }

    // --- Password Recovery ---
    public string? RecoveryEmail { get; set; }
    public string? PasswordResetCode { get; set; }
    public DateTime? PasswordResetCodeExpiry { get; set; }
}
