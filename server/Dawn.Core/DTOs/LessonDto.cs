namespace Dawn.Core.DTOs;

public class LessonDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public string? PdfUrl { get; set; }
    public string? PptUrl { get; set; }
    public int Order { get; set; }
    public int CourseId { get; set; }
}
