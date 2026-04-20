namespace Dawn.Api.DTOs;

public class CourseUpdateDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    // Optional replacement for Thumbnail
    public bool IsSequential { get; set; }
    
    // Optional replacement for Thumbnail
    public IFormFile? ThumbnailFile { get; set; }
    public bool IsPublished { get; set; }
}

public class CourseCreateRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    public bool IsSequential { get; set; }
    public bool IsPublished { get; set; }
    
    // Optional Thumbnail
    public IFormFile? ThumbnailFile { get; set; }

    // Optional: Admin can assign this course to a specific Teacher (by their UserId)
    // If left empty when Admin creates it, the Admin owns it (platform revenue - no payout split)
    public string? AssignedInstructorId { get; set; }
}
