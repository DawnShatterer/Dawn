using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Lesson : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Video: either a URL (YouTube/Drive) or a relative path to stored file
    public string? VideoUrl { get; set; }
    public string? PdfUrl { get; set; }
    public string? PptUrl { get; set; }
    
    // For sorting lessons sequentially
    public int Order { get; set; } = 0;

    // The contribution of this lesson to the total 100% course completion (e.g. 20)
    public int CompletionWeight { get; set; } = 1;

    // Foreign Key to Course
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public bool IsFreePreview { get; set; } = false; // Allow access to non-enrolled users
}
