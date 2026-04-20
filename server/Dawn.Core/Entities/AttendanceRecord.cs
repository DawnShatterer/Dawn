using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class AttendanceRecord : BaseEntity
{
    public DateTime Date { get; set; }
    public string Status { get; set; } = "Present"; // Present, Absent, Late

    // Relationships
    public int ModuleId { get; set; }
    public Course Module { get; set; } = null!;

    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser Student { get; set; } = null!;
}
