using Dawn.Core.Common;

namespace Dawn.Core.Entities;

/// <summary>
/// Immutable ledger of all points earned and spent by students.
/// Positive amounts = earned, Negative amounts = spent/redeemed.
/// </summary>
public class PointsTransaction : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    public int Points { get; set; }          // e.g. +500 or -2500
    public string Reason { get; set; } = string.Empty;  // "Purchased 'React Mastery'", "Redeemed 20% Coupon"
    public string Category { get; set; } = string.Empty; // "Purchase", "DailyLogin", "Referral", "Redemption"

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
}
