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
public class AttendanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AttendanceController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Teacher: Get the enrolled student roster for a specific module (course).
    /// </summary>
    [HttpGet("roster/{courseId}")]
    [Authorize(Roles = "Teacher,Admin,Staff")]
    public async Task<IActionResult> GetRoster(int courseId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);

        // Teachers can only view roster for their own modules
        if (role == "Teacher")
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Module not found.");
            if (course.InstructorId != userId) return Forbid();
        }

        var students = await _context.Enrollments
            .Where(e => e.CourseId == courseId)
            .Include(e => e.Student)
            .Select(e => new
            {
                StudentId = e.StudentId,
                FullName = e.Student.FullName,
                Email = e.Student.Email
            })
            .ToListAsync();

        return Ok(students);
    }

    /// <summary>
    /// Teacher: Submit attendance for a list of students on a given date.
    /// </summary>
    [HttpPost("mark")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);

        // Verify the teacher owns this module
        if (role == "Teacher")
        {
            var course = await _context.Courses.FindAsync(dto.ModuleId);
            if (course == null) return NotFound("Module not found.");
            if (course.InstructorId != userId) return Forbid();
        }

        var date = dto.Date.Date; // Normalize to midnight

        // Remove any existing records for this module+date so we can overwrite
        var existing = await _context.AttendanceRecords
            .Where(a => a.ModuleId == dto.ModuleId && a.Date.Date == date)
            .ToListAsync();
        _context.AttendanceRecords.RemoveRange(existing);

        // Insert new records
        foreach (var entry in dto.Entries)
        {
            _context.AttendanceRecords.Add(new AttendanceRecord
            {
                ModuleId = dto.ModuleId,
                StudentId = entry.StudentId,
                Date = date,
                Status = entry.Status // "Present", "Absent", "Late"
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = $"Attendance saved for {dto.Entries.Count} students." });
    }

    /// <summary>
    /// Teacher/Admin: Get attendance records for a module on a specific date.
    /// </summary>
    [HttpGet("module/{courseId}")]
    [Authorize(Roles = "Teacher,Admin,Staff")]
    public async Task<IActionResult> GetModuleAttendance(int courseId, [FromQuery] DateTime? date)
    {
        var records = _context.AttendanceRecords
            .Where(a => a.ModuleId == courseId);

        if (date.HasValue)
            records = records.Where(a => a.Date.Date == date.Value.Date);

        var result = await records
            .Include(a => a.Student)
            .OrderByDescending(a => a.Date)
            .Select(a => new
            {
                a.Id,
                a.Date,
                a.Status,
                StudentId = a.StudentId,
                StudentName = a.Student.FullName,
                StudentEmail = a.Student.Email
            })
            .ToListAsync();

        return Ok(result);
    }

    /// <summary>
    /// Student: Get their own attendance records across all modules.
    /// </summary>
    [HttpGet("my-attendance")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyAttendance()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var records = await _context.AttendanceRecords
            .Where(a => a.StudentId == userId)
            .Include(a => a.Module)
            .OrderByDescending(a => a.Date)
            .Select(a => new
            {
                a.Id,
                a.Date,
                a.Status,
                ModuleId = a.ModuleId,
                ModuleName = a.Module.Title
            })
            .ToListAsync();

        // Calculate summary per module
        var summary = records
            .GroupBy(r => new { r.ModuleId, r.ModuleName })
            .Select(g => new
            {
                g.Key.ModuleId,
                g.Key.ModuleName,
                TotalClasses = g.Count(),
                Present = g.Count(r => r.Status == "Present"),
                Late = g.Count(r => r.Status == "Late"),
                Absent = g.Count(r => r.Status == "Absent"),
                Percentage = g.Count() > 0
                    ? Math.Round((g.Count(r => r.Status == "Present" || r.Status == "Late") * 100.0) / g.Count(), 1)
                    : 0
            })
            .ToList();

        return Ok(new { records, summary });
    }
}

// ─── DTOs ───

public class MarkAttendanceDto
{
    public int ModuleId { get; set; }
    public DateTime Date { get; set; }
    public List<AttendanceEntry> Entries { get; set; } = new();
}

public class AttendanceEntry
{
    public string StudentId { get; set; } = string.Empty;
    public string Status { get; set; } = "Present"; // Present, Absent, Late
}
