using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Course : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "Uncategorized";
    public string? ThumbnailUrl { get; set; }
    public string InstructorId { get; set; } = string.Empty; // Links to ApplicationUser

    // Quality & Management
    public bool IsPublished { get; set; } = false; // Courses start as drafts
    public bool IsArchived { get; set; } = false; // Soft-delete
    public bool IsSequential { get; set; } = false; // If true, students must follow order

    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<LiveClass> LiveClasses { get; set; } = new List<LiveClass>();
    public ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
}