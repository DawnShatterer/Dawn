using Dawn.Core.Common;

namespace Dawn.Core.Entities;

/// <summary>
/// Single-use discount coupons generated when a student redeems Dawn Points.
/// </summary>
public class CourseCoupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;          // e.g. "DAWN-X79K-20OFF"
    public int DiscountPercent { get; set; } = 20;             // 20% off by default
    public decimal? MaxDiscountAmount { get; set; }            // Optional cap (e.g., max 500 Rs off)

    public string OwnerId { get; set; } = string.Empty;       // The student who earned it
    public ApplicationUser Owner { get; set; } = null!;

    public bool IsUsed { get; set; } = false;
    public int? UsedOnCourseId { get; set; }                   // Which course it was applied to
    public Course? UsedOnCourse { get; set; }

    public DateTime ExpiresAt { get; set; }                    // Coupons expire after 30 days
    public DateTime? UsedAt { get; set; }
}
