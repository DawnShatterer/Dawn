using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Course : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string InstructorId { get; set; } = string.Empty; // Links to ApplicationUser
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<LiveClass> LiveClasses { get; set; } = new List<LiveClass>();
    public ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<CourseReview> Reviews { get; set; } = new List<CourseReview>();
}