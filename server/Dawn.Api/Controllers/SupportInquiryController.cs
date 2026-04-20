using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SupportInquiryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SupportInquiryController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// POST /api/SupportInquiry
    /// Public endpoint for anyone to send a support message.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateInquiry([FromBody] SupportInquiryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { Message = "Name, Email, and Message are required." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var inquiry = new SupportInquiry
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Subject = dto.Subject ?? "General Inquiry",
            Message = dto.Message,
            UserId = userId, // Will be null if anonymous
            CreatedAt = DateTime.UtcNow,
            Status = "Unread"
        };

        _context.SupportInquiries.Add(inquiry);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Your message has been sent successfully. Our support team will get back to you soon." });
    }

    /// <summary>
    /// GET /api/SupportInquiry
    /// Staff/Admin endpoint to view all support messages.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetInquiries([FromQuery] string? status)
    {
        var query = _context.SupportInquiries.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(i => i.Status == status);
        }

        var inquiries = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        return Ok(inquiries);
    }

    /// <summary>
    /// PUT /api/SupportInquiry/{id}/status
    /// Staff/Admin endpoint to update the status of an inquiry (e.g., Mark as Read/Resolved).
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateInquiryStatus(int id, [FromBody] UpdateSupportStatusDto dto)
    {
        var inquiry = await _context.SupportInquiries.FindAsync(id);
        if (inquiry == null) return NotFound(new { Message = "Inquiry not found." });

        if (dto.Status != "Unread" && dto.Status != "Read" && dto.Status != "Resolved")
            return BadRequest(new { Message = "Invalid status. Must be Unread, Read, or Resolved." });

        inquiry.Status = dto.Status;
        await _context.SaveChangesAsync();

        return Ok(new { Message = $"Inquiry marked as {dto.Status}." });
    }
}

// ──── DTOs ────

public class SupportInquiryDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class UpdateSupportStatusDto
{
    public string Status { get; set; } = string.Empty;
}
