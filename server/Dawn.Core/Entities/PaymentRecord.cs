using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class PaymentRecord : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser Student { get; set; } = null!;

    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public decimal Amount { get; set; }
    public string Gateway { get; set; } = string.Empty;       // "esewa" or "khalti"
    public string TransactionId { get; set; } = string.Empty;  // eSewa refId / Khalti pidx
    public string Status { get; set; } = "Pending";            // Pending, Completed, Failed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
