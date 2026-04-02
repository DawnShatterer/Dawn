using Dawn.Core.Common;
using System.ComponentModel.DataAnnotations;

namespace Dawn.Core.Entities;

/// <summary>
/// A request made by an instructor to withdraw their earnings.
/// </summary>
public class PayoutRequest : BaseEntity
{
    [Required]
    public string InstructorId { get; set; } = string.Empty;
    public ApplicationUser Instructor { get; set; } = null!;

    [Required]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // "Pending", "Paid", "Rejected"

    [Required]
    [MaxLength(200)]
    public string PaymentMethod { get; set; } = string.Empty; // e.g. "eSewa: 9840000000", "Bank: NIC ASIA - 1234..."

    // Admin context when processing the request
    [MaxLength(200)]
    public string? AdminNotes { get; set; } // Notes or transaction reference IDs

    public DateTime? ProcessedAt { get; set; }
}
