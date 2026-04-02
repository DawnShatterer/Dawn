using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Certificate : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? FileUrl { get; set; } // Path to the uploaded certificate file (PDF/image)
    
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }
    
    public int? CourseId { get; set; } // Optional — may not relate to a specific Dawn course
    public Course? Course { get; set; }
}
