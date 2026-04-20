namespace Dawn.Core.Entities;

public class SupportInquiry
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Unread"; // Unread, Read, Resolved
    public string? UserId { get; set; } // If logged in
}
