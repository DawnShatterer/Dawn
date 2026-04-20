using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class SemesterInvoice : BaseEntity
{
    public string Description { get; set; } = string.Empty; // e.g. "Year 1 Semester 1 Tuition Fee"
    public decimal AmountNpr { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }

    public string? ESewaTransactionId { get; set; }
    public string? ESewaReceiptUrl { get; set; }

    // Relationship to Student
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser Student { get; set; } = null!;
}
