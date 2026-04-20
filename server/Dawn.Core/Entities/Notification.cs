using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Notification : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public string? Link { get; set; }

    // Relationships
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
}
