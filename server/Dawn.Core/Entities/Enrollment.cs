using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Enrollment : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser Student { get; set; } = null!;

    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public int Progress { get; set; } = 0; // 0-100%
}
