using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class CourseAssignmentAudit : BaseEntity
{
    public int CourseId { get; set; }
    public string? PreviousTeacherId { get; set; }
    public string NewTeacherId { get; set; } = string.Empty;
    public string AdminUserId { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Course Course { get; set; } = null!;
    public ApplicationUser NewTeacher { get; set; } = null!;
    public ApplicationUser AdminUser { get; set; } = null!;
}
