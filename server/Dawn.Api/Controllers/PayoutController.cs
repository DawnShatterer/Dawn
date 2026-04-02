using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Dawn.Core.Common;

namespace Dawn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PayoutController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PayoutController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets the instructor's total earnings, available balance, and history of payout requests.
    /// </summary>
    [HttpGet("my-payouts")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetMyPayouts()
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (instructorId == null) return Unauthorized();

        // 1. Calculate Gross Revenue (All successful payments for courses they own)
        var courseIds = await _context.Courses
            .Where(c => c.InstructorId == instructorId)
            .Select(c => c.Id)
            .ToListAsync();

        var grossSales = await _context.PaymentRecords
            .Where(p => courseIds.Contains(p.CourseId) && p.Status == "Completed")
            .SumAsync(p => p.Amount);

        // 2. Instructor gets 80% cut
        var netEarnings = Math.Round(grossSales * 0.8m, 2);

        // 3. Subtract what they've already requested/been paid
        var requestedOrPaid = await _context.PayoutRequests
            .Where(pr => pr.InstructorId == instructorId && (pr.Status == "Pending" || pr.Status == "Paid"))
            .SumAsync(pr => pr.Amount);

        var availableBalance = Math.Max(0, netEarnings - requestedOrPaid);

        var payoutHistory = await _context.PayoutRequests
            .Where(pr => pr.InstructorId == instructorId)
            .OrderByDescending(pr => pr.CreatedAt)
            .Select(pr => new
            {
                pr.Id,
                pr.Amount,
                pr.PaymentMethod,
                pr.Status,
                pr.AdminNotes,
                pr.CreatedAt,
                pr.ProcessedAt
            })
            .ToListAsync();

        return Ok(new
        {
            netEarnings,
            withdrawnOrPending = requestedOrPaid,
            availableBalance,
            payoutHistory
        });
    }

    /// <summary>
    /// Instructor requests a payout to their bank/eSewa.
    /// </summary>
    [HttpPost("request")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> RequestPayout([FromBody] PayoutCreateDto dto)
    {
        var instructorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (instructorId == null) return Unauthorized();

        if (dto.Amount < 1000)
            return BadRequest(new { Message = "Minimum payout request is 1,000 Rs." });

        if (string.IsNullOrWhiteSpace(dto.PaymentMethod))
            return BadRequest(new { Message = "Payment details (Bank info or eSewa ID) are required." });

        // Calculate current available balance to verify they have sufficient funds
        var courseIds = await _context.Courses
            .Where(c => c.InstructorId == instructorId)
            .Select(c => c.Id)
            .ToListAsync();

        var grossSales = await _context.PaymentRecords
            .Where(p => courseIds.Contains(p.CourseId) && p.Status == "Completed")
            .SumAsync(p => p.Amount);

        var netEarnings = Math.Round(grossSales * 0.8m, 2);

        var requestedOrPaid = await _context.PayoutRequests
            .Where(pr => pr.InstructorId == instructorId && (pr.Status == "Pending" || pr.Status == "Paid"))
            .SumAsync(pr => pr.Amount);

        var availableBalance = netEarnings - requestedOrPaid;

        if (dto.Amount > availableBalance)
            return BadRequest(new { Message = $"Insufficient funds. Your available balance is Rs. {availableBalance:F2}." });

        var payout = new PayoutRequest
        {
            InstructorId = instructorId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.PayoutRequests.Add(payout);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Payout request submitted successfully. It will be processed soon." });
    }

    /// <summary>
    /// Admin gets all pending payout requests across the platform.
    /// </summary>
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPayouts([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        if (page < 1) page = 1;
        if (limit < 1 || limit > 50) limit = 10;

        var totalCount = await _context.PayoutRequests.CountAsync();
        var payouts = await _context.PayoutRequests
            .Include(pr => pr.Instructor)
            .OrderByDescending(pr => pr.CreatedAt)
            .Select(pr => new
            {
                pr.Id,
                InstructorName = pr.Instructor.FullName,
                InstructorEmail = pr.Instructor.Email,
                pr.Amount,
                pr.PaymentMethod,
                pr.Status,
                pr.AdminNotes,
                pr.CreatedAt,
                pr.ProcessedAt
            })
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(new PagedResult<object>(payouts, totalCount, page, limit));
    }

    /// <summary>
    /// Admin processes a payout (marks as Paid or Rejected).
    /// </summary>
    [HttpPut("{id}/process")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ProcessPayout(int id, [FromBody] PayoutProcessDto dto)
    {
        var payout = await _context.PayoutRequests.FindAsync(id);
        if (payout == null) return NotFound("Payout request not found.");

        payout.Status = dto.Status; // "Paid" or "Rejected"
        payout.AdminNotes = dto.AdminNotes;
        payout.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { Message = $"Payout marked as {dto.Status} successfully." });
    }
}

// ── DTOs ──
public class PayoutCreateDto
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
}

public class PayoutProcessDto
{
    public string Status { get; set; } = string.Empty; // Paid or Rejected
    public string? AdminNotes { get; set; }
}
