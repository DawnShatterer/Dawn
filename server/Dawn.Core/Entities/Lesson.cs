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

    // Foreign Key to Course
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;
}
