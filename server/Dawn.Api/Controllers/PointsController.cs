using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PointsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PointsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── Points configuration ──
    private static class PointsConfig
    {
        public const int OnCoursePurchase = 500;
        public const int OnDailyLogin = 50;
        public const int OnSocialLink = 200;
        public const int OnReferral = 300;
        public const int OnQuizComplete = 100;
        public const int OnFirstEnrollment = 150;
        public const int RedemptionCost = 2500;
        public const int CouponDiscountPercent = 20;
    }

    /// <summary>
    /// Get current points balance and recent history for the logged-in user.
    /// </summary>
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var transactions = await _context.PointsTransactions
            .Where(pt => pt.UserId == userId)
            .OrderByDescending(pt => pt.TransactionDate)
            .ToListAsync();

        var totalPoints = transactions.Sum(pt => pt.Points);

        return Ok(new
        {
            totalPoints,
            canRedeem = totalPoints >= PointsConfig.RedemptionCost,
            redemptionCost = PointsConfig.RedemptionCost,
            transactions = transactions.Select(t => new
            {
                t.Points,
                t.Reason,
                t.Category,
                date = t.TransactionDate
            })
        });
    }

    /// <summary>
    /// Award points for a specific action (called internally or by frontend for trackable events).
    /// </summary>
    [HttpPost("earn")]
    public async Task<IActionResult> EarnPoints([FromBody] EarnPointsDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        int points;
        string reason;

        switch (dto.Action.ToLower())
        {
            case "daily_login":
                // Check if already claimed today
                var today = DateTime.UtcNow.Date;
                var alreadyClaimed = await _context.PointsTransactions
                    .AnyAsync(pt => pt.UserId == userId && pt.Category == "DailyLogin" && pt.TransactionDate.Date == today);
                if (alreadyClaimed)
                    return BadRequest(new { Message = "Daily login points already claimed today!" });
                points = PointsConfig.OnDailyLogin;
                reason = "Daily Login Bonus";
                break;

            case "social_link":
                // Check if already linked this platform
                var alreadyLinked = await _context.PointsTransactions
                    .AnyAsync(pt => pt.UserId == userId && pt.Category == "SocialLink" && pt.Reason.Contains(dto.Detail ?? ""));
                if (alreadyLinked)
                    return BadRequest(new { Message = "You already earned points for linking this account!" });
                points = PointsConfig.OnSocialLink;
                reason = $"Linked {dto.Detail ?? "Social"} Account";
                break;

            case "quiz_complete":
                points = PointsConfig.OnQuizComplete;
                reason = $"Completed Quiz: {dto.Detail ?? "Unknown"}";
                break;

            case "referral":
                points = PointsConfig.OnReferral;
                reason = $"Referred a friend: {dto.Detail ?? ""}";
                break;

            default:
                return BadRequest(new { Message = "Unknown action." });
        }

        _context.PointsTransactions.Add(new PointsTransaction
        {
            UserId = userId,
            Points = points,
            Reason = reason,
            Category = dto.Action.ToLower() switch
            {
                "daily_login" => "DailyLogin",
                "social_link" => "SocialLink",
                "quiz_complete" => "QuizComplete",
                "referral" => "Referral",
                _ => "Other"
            },
            TransactionDate = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var totalPoints = await _context.PointsTransactions
            .Where(pt => pt.UserId == userId)
            .SumAsync(pt => pt.Points);

        return Ok(new { pointsEarned = points, totalPoints, reason });
    }

    /// <summary>
    /// Redeem 2500 points for a 20% discount coupon.
    /// </summary>
    [HttpPost("redeem")]
    public async Task<IActionResult> RedeemCoupon()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var totalPoints = await _context.PointsTransactions
            .Where(pt => pt.UserId == userId)
            .SumAsync(pt => pt.Points);

        if (totalPoints < PointsConfig.RedemptionCost)
            return BadRequest(new { Message = $"You need {PointsConfig.RedemptionCost} points to redeem. You have {totalPoints}." });

        // Generate unique coupon code
        var code = $"DAWN-{Guid.NewGuid().ToString()[..4].ToUpper()}-{PointsConfig.CouponDiscountPercent}OFF";

        var coupon = new CourseCoupon
        {
            Code = code,
            DiscountPercent = PointsConfig.CouponDiscountPercent,
            MaxDiscountAmount = 500, // Max 500 Rs. discount
            OwnerId = userId,
            IsUsed = false,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _context.CourseCoupons.Add(coupon);

        // Deduct points
        _context.PointsTransactions.Add(new PointsTransaction
        {
            UserId = userId,
            Points = -PointsConfig.RedemptionCost,
            Reason = $"Redeemed coupon: {code}",
            Category = "Redemption",
            TransactionDate = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            couponCode = code,
            discountPercent = PointsConfig.CouponDiscountPercent,
            maxDiscount = coupon.MaxDiscountAmount,
            expiresAt = coupon.ExpiresAt,
            remainingPoints = totalPoints - PointsConfig.RedemptionCost
        });
    }

    /// <summary>
    /// Get all coupons owned by the logged-in user.
    /// </summary>
    [HttpGet("coupons")]
    public async Task<IActionResult> GetMyCoupons()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var coupons = await _context.CourseCoupons
            .Where(c => c.OwnerId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Code,
                c.DiscountPercent,
                c.MaxDiscountAmount,
                c.IsUsed,
                c.ExpiresAt,
                c.UsedAt,
                expired = c.ExpiresAt < DateTime.UtcNow
            })
            .ToListAsync();

        return Ok(coupons);
    }

    /// <summary>
    /// Validate a coupon code (used by the payment modal before checkout).
    /// </summary>
    [HttpGet("validate-coupon/{code}")]
    public async Task<IActionResult> ValidateCoupon(string code)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var coupon = await _context.CourseCoupons
            .FirstOrDefaultAsync(c => c.Code == code && c.OwnerId == userId);

        if (coupon == null)
            return NotFound(new { valid = false, message = "Coupon not found or does not belong to you." });

        if (coupon.IsUsed)
            return BadRequest(new { valid = false, message = "This coupon has already been used." });

        if (coupon.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { valid = false, message = "This coupon has expired." });

        return Ok(new
        {
            valid = true,
            discountPercent = coupon.DiscountPercent,
            maxDiscountAmount = coupon.MaxDiscountAmount,
            message = $"{coupon.DiscountPercent}% off (max Rs. {coupon.MaxDiscountAmount})"
        });
    }

    /// <summary>
    /// Internal method to award purchase points — called from PaymentController.
    /// </summary>
    public static async Task AwardPurchasePoints(ApplicationDbContext context, string userId, string courseName)
    {
        context.PointsTransactions.Add(new PointsTransaction
        {
            UserId = userId,
            Points = PointsConfig.OnCoursePurchase,
            Reason = $"Purchased '{courseName}'",
            Category = "Purchase",
            TransactionDate = DateTime.UtcNow
        });

        // Bonus: check if this is their first ever enrollment
        var enrollmentCount = await context.Enrollments.CountAsync(e => e.StudentId == userId);
        if (enrollmentCount <= 1) // First enrollment (just created)
        {
            context.PointsTransactions.Add(new PointsTransaction
            {
                UserId = userId,
                Points = PointsConfig.OnFirstEnrollment,
                Reason = "First course enrollment bonus!",
                Category = "Milestone",
                TransactionDate = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Get the top 10 students based on total points earned.
    /// </summary>
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard()
    {
        var leaderboard = await _context.PointsTransactions
            .GroupBy(pt => pt.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalPoints = g.Sum(pt => pt.Points)
            })
            .OrderByDescending(x => x.TotalPoints)
            .Take(10)
            .Join(_context.Users, 
                points => points.UserId, 
                user => user.Id, 
                (points, user) => new
                {
                    user.Id,
                    user.FullName,
                    user.ProfilePictureUrl,
                    points.TotalPoints,
                    user.Grade
                })
            .ToListAsync();

        return Ok(leaderboard);
    }
}

// ── DTOs ──
public class EarnPointsDto
{
    public string Action { get; set; } = string.Empty; // "daily_login", "social_link", "quiz_complete", "referral"
    public string? Detail { get; set; } // Extra info like social platform name
}
