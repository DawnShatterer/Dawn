using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TuitionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TuitionController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ──── ADMIN / STAFF ENDPOINTS ────

    /// <summary>
    /// POST /api/Tuition/generate
    /// Admin/Staff generates a batch of semester invoices for a batch or individual student.
    /// </summary>
    [HttpPost("generate")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GenerateInvoices([FromBody] GenerateInvoiceDto dto)
    {
        if (dto.AmountNpr <= 0)
            return BadRequest(new { Message = "Amount must be greater than zero." });

        var studentIds = new List<string>();

        if (!string.IsNullOrEmpty(dto.StudentId))
        {
            studentIds.Add(dto.StudentId);
        }
        else if (dto.BatchId.HasValue)
        {
            var batch = await _context.Batches.FindAsync(dto.BatchId.Value);
            if (batch == null) return NotFound(new { Message = "Batch not found." });

            studentIds = await _context.Users
                .Where(u => u.BatchId == dto.BatchId.Value && u.Role == "Student")
                .Select(u => u.Id)
                .ToListAsync();
        }
        else
        {
            return BadRequest(new { Message = "Provide either StudentId or BatchId." });
        }

        if (!studentIds.Any())
            return BadRequest(new { Message = "No students found for this selection." });

        // Prevent duplicates for same description + student
        var existing = await _context.SemesterInvoices
            .Where(i => studentIds.Contains(i.StudentId) && i.Description == dto.Description)
            .Select(i => i.StudentId)
            .ToListAsync();

        var newStudentIds = studentIds.Except(existing).ToList();

        var invoices = newStudentIds.Select(sid => new SemesterInvoice
        {
            StudentId = sid,
            Description = dto.Description,
            AmountNpr = dto.AmountNpr,
            DueDate = dto.DueDate,
            IsPaid = false
        }).ToList();

        _context.SemesterInvoices.AddRange(invoices);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            Message = $"Generated {invoices.Count} invoice(s). Skipped {existing.Count} duplicate(s).",
            generated = invoices.Count,
            skipped = existing.Count
        });
    }

    /// <summary>
    /// GET /api/Tuition/all
    /// Admin/Staff views all invoices with filtering.
    /// </summary>
    [HttpGet("all")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAllInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] bool? isPaid = null,
        [FromQuery] int? batchId = null)
    {
        var query = _context.SemesterInvoices
            .Include(i => i.Student)
            .AsQueryable();

        if (isPaid.HasValue)
            query = query.Where(i => i.IsPaid == isPaid.Value);

        if (batchId.HasValue)
            query = query.Where(i => i.Student.BatchId == batchId.Value);

        var total = await query.CountAsync();

        var invoices = await query
            .OrderByDescending(i => i.DueDate)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(i => new
            {
                i.Id,
                i.Description,
                i.AmountNpr,
                i.DueDate,
                i.IsPaid,
                i.PaidAt,
                i.ESewaTransactionId,
                StudentName = i.Student.FullName,
                StudentEmail = i.Student.Email,
                BatchId = i.Student.BatchId
            })
            .ToListAsync();

        return Ok(new { invoices, total, page, limit });
    }

    /// <summary>
    /// PUT /api/Tuition/mark-paid/{id}
    /// Admin/Staff manually marks an invoice as paid.
    /// </summary>
    [HttpPut("mark-paid/{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> MarkInvoicePaid(int id)
    {
        var invoice = await _context.SemesterInvoices.FindAsync(id);
        if (invoice == null) return NotFound(new { Message = "Invoice not found." });

        if (invoice.IsPaid) return BadRequest(new { Message = "Invoice is already marked as paid." });

        invoice.IsPaid = true;
        invoice.PaidAt = DateTime.UtcNow;
        _context.SemesterInvoices.Update(invoice);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Invoice successfully marked as paid." });
    }

    // ──── STUDENT ENDPOINTS ────

    /// <summary>
    /// GET /api/Tuition/my-invoices
    /// Student views their own semester invoices.
    /// </summary>
    [HttpGet("my-invoices")]
    public async Task<IActionResult> GetMyInvoices()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var invoices = await _context.SemesterInvoices
            .Where(i => i.StudentId == userId)
            .OrderByDescending(i => i.DueDate)
            .Select(i => new
            {
                i.Id,
                i.Description,
                i.AmountNpr,
                i.DueDate,
                i.IsPaid,
                i.PaidAt,
                i.ESewaTransactionId
            })
            .ToListAsync();

        var totalDue = invoices.Where(i => !i.IsPaid).Sum(i => i.AmountNpr);
        var totalPaid = invoices.Where(i => i.IsPaid).Sum(i => i.AmountNpr);

        return Ok(new { invoices, totalDue, totalPaid });
    }
}

// ──── DTOs ────

public class GenerateInvoiceDto
{
    public string? StudentId { get; set; }
    public int? BatchId { get; set; }
    public string Description { get; set; } = string.Empty; // e.g. "Year 1 Semester 1 Tuition"
    public decimal AmountNpr { get; set; }
    public DateTime DueDate { get; set; }
}
