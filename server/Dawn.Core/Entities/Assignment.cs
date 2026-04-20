using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Assignment : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }

    // Relationship to Course
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
}