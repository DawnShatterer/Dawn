using Microsoft.AspNetCore.Identity;

namespace Dawn.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? InstitutionName { get; set; } 
    public int? InstitutionId { get; set; }
    public Institution? Institution { get; set; }
    
    public string Role { get; set; } = "Student"; // Default role
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int LoginCount { get; set; } = 0;

    // --- Profile Expansion Properties ---
    public string? ProfilePictureUrl { get; set; }
    public string? NickName { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Grade { get; set; }

    // --- Notification & Interface Settings ---
    public bool PrefEmailNotif { get; set; } = true;
    public bool PrefInAppNotif { get; set; } = true;
    public bool PrefSessions { get; set; } = false;
    public bool PrefAssignments { get; set; } = false;
    public bool PrefAnnouncements { get; set; } = false;
    public bool PrefOthers { get; set; } = true;
    public bool GuideLearn { get; set; } = true;
    public bool GuideTest { get; set; } = true;
    public bool GuideMock { get; set; } = true;
}