namespace Dawn.Core.DTOs;

public class CourseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string InstructorId { get; set; } = string.Empty;
    public string? InstructorName { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; }
    public bool IsArchived { get; set; }
    public bool IsSequential { get; set; }
}


public class CourseCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class AssignTeacherDto
{
    public string TeacherId { get; set; } = string.Empty;
}