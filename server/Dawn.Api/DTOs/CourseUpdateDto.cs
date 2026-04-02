namespace Dawn.Api.DTOs;

public class CourseUpdateDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    
    // Optional replacement for Thumbnail
    public IFormFile? ThumbnailFile { get; set; }
}

public class CourseCreateRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    
    // Optional Thumbnail
    public IFormFile? ThumbnailFile { get; set; }
}
