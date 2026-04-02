namespace Dawn.Core.DTOs;

public class LiveClassDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string MeetingLink { get; set; } = string.Empty;
    public string? MeetingPassword { get; set; }
    public int CourseId { get; set; }
}

public class LiveClassCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string MeetingLink { get; set; } = string.Empty;
    public string? MeetingPassword { get; set; }
    public int CourseId { get; set; }
}
