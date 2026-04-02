namespace Dawn.Api.DTOs;

public class LessonCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public int CourseId { get; set; }
    
    // Video: either a URL (YouTube/Drive link) or a file upload
    public string? VideoUrl { get; set; }
    public IFormFile? VideoFile { get; set; }
    public IFormFile? PdfFile { get; set; }
    public IFormFile? PptFile { get; set; }
}
