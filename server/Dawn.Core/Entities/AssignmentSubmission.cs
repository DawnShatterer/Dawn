using Dawn.Core.Common;

namespace Dawn.Core.Entities;

/// <summary>
/// A student's work submission for a specific assignment.
/// Constraints: PDF or ZIP files only, max 100MB.
/// </summary>
public class AssignmentSubmission : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser Student { get; set; } = null!;

    public int AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public string FileUrl { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Instructor grading
    public int? Grade { get; set; } // 0-100
    public string? Feedback { get; set; }
    public string? GradedByInstructorId { get; set; }
    public DateTime? GradedAt { get; set; }

    public bool IsGraded => Grade.HasValue;
}
