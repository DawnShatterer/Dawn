using System.ComponentModel.DataAnnotations;

using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class LiveClass : BaseEntity
{
    
    [Required]
    public string Title { get; set; } = string.Empty;
    
    public string Topic { get; set; } = string.Empty;
    
    [Required]
    public DateTime StartTime { get; set; }
    
    public int DurationMinutes { get; set; }
    
    [Required]
    public string MeetingLink { get; set; } = string.Empty;
    
    public string? MeetingPassword { get; set; }
    
    // Navigation Property
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;
}
