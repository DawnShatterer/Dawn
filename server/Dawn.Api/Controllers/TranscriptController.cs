using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TranscriptController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TranscriptController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GET /api/Transcript/my
    /// Returns the current student's full transcript with grades based on assignments only (100% weight).
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyTranscript()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.StudentId == userId)
            .ToListAsync();

        if (!enrollments.Any())
            return Ok(new { modules = new List<object>(), gpa = 0.0, totalCredits = 0 });

        var courseIds = enrollments.Select(e => e.CourseId).ToList();

        // ── Assignment grades (60% weight) ──
        var assignmentGrades = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Where(s => s.StudentId == userId && courseIds.Contains(s.Assignment.CourseId) && s.Grade.HasValue)
            .GroupBy(s => s.Assignment.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                AvgGrade = g.Average(s => (double)s.Grade!.Value)
            })
            .ToListAsync();

        // ── Quiz scores (30% weight) ──
        var quizScores = await _context.Submissions
            .Include(s => s.Quiz)
            .Where(s => s.StudentId == userId && courseIds.Contains(s.Quiz.CourseId) && s.TotalPoints > 0)
            .GroupBy(s => s.Quiz.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                AvgPercent = g.Average(s => s.TotalPoints > 0 ? ((double)s.Score / s.TotalPoints) * 100 : 0)
            })
            .ToListAsync();

        // ── Attendance (10% weight) ──
        var attendanceStats = await _context.AttendanceRecords
            .Where(a => a.StudentId == userId && courseIds.Contains(a.ModuleId))
            .GroupBy(a => a.ModuleId)
            .Select(g => new
            {
                CourseId = g.Key,
                Total = g.Count(),
                Present = g.Count(a => a.Status == "Present" || a.Status == "Late")
            })
            .ToListAsync();

        // ── Build per-module transcript ──
        var modules = enrollments.Select(e =>
        {
            var hwAvg = assignmentGrades.FirstOrDefault(a => a.CourseId == e.CourseId)?.AvgGrade ?? 0;

            // Use assignments only (100% weight)
            var finalScore = hwAvg;

            // Letter grade
            string letterGrade;
            double gradePoint;
            if (finalScore >= 90) { letterGrade = "A"; gradePoint = 4.0; }
            else if (finalScore >= 80) { letterGrade = "B"; gradePoint = 3.0; }
            else if (finalScore >= 70) { letterGrade = "C"; gradePoint = 2.0; }
            else if (finalScore >= 60) { letterGrade = "D"; gradePoint = 1.0; }
            else { letterGrade = "F"; gradePoint = 0.0; }

            return new
            {
                moduleId = e.CourseId,
                moduleTitle = e.Course?.Title ?? "Unknown",
                category = e.Course?.Category ?? "General",
                assignmentAvg = Math.Round(hwAvg, 1),
                quizAvg = 0.0,
                attendancePercent = 0.0,
                finalScore = Math.Round(finalScore, 1),
                letterGrade,
                gradePoint,
                progress = e.Progress
            };
        }).ToList();

        // ── Overall GPA ──
        var gpa = modules.Any() ? Math.Round(modules.Average(m => m.gradePoint), 2) : 0.0;

        return Ok(new
        {
            modules,
            gpa,
            totalModules = modules.Count,
            completedModules = modules.Count(m => m.progress >= 100)
        });
    }

    /// <summary>
    /// GET /api/Transcript/student/{studentId}
    /// Admin/Staff endpoint to view any student's transcript.
    /// </summary>
    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "Admin,Staff,Teacher")]
    public async Task<IActionResult> GetStudentTranscript(string studentId)
    {
        var student = await _context.Users.FindAsync(studentId);
        if (student == null) return NotFound("Student not found.");

        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.StudentId == studentId)
            .ToListAsync();

        if (!enrollments.Any())
            return Ok(new { studentName = student.FullName, modules = new List<object>(), gpa = 0.0 });

        var courseIds = enrollments.Select(e => e.CourseId).ToList();

        var assignmentGrades = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Where(s => s.StudentId == studentId && courseIds.Contains(s.Assignment.CourseId) && s.Grade.HasValue)
            .GroupBy(s => s.Assignment.CourseId)
            .Select(g => new { CourseId = g.Key, AvgGrade = g.Average(s => (double)s.Grade!.Value) })
            .ToListAsync();

        var quizScores = await _context.Submissions
            .Include(s => s.Quiz)
            .Where(s => s.StudentId == studentId && courseIds.Contains(s.Quiz.CourseId) && s.TotalPoints > 0)
            .GroupBy(s => s.Quiz.CourseId)
            .Select(g => new { CourseId = g.Key, AvgPercent = g.Average(s => s.TotalPoints > 0 ? ((double)s.Score / s.TotalPoints) * 100 : 0) })
            .ToListAsync();

        var attendanceStats = await _context.AttendanceRecords
            .Where(a => a.StudentId == studentId && courseIds.Contains(a.ModuleId))
            .GroupBy(a => a.ModuleId)
            .Select(g => new { CourseId = g.Key, Total = g.Count(), Present = g.Count(a => a.Status == "Present" || a.Status == "Late") })
            .ToListAsync();

        var modules = enrollments.Select(e =>
        {
            var hwAvg = assignmentGrades.FirstOrDefault(a => a.CourseId == e.CourseId)?.AvgGrade ?? 0;
            
            // Use assignments only (100% weight)
            var finalScore = hwAvg;

            string letterGrade;
            double gradePoint;
            if (finalScore >= 90) { letterGrade = "A"; gradePoint = 4.0; }
            else if (finalScore >= 80) { letterGrade = "B"; gradePoint = 3.0; }
            else if (finalScore >= 70) { letterGrade = "C"; gradePoint = 2.0; }
            else if (finalScore >= 60) { letterGrade = "D"; gradePoint = 1.0; }
            else { letterGrade = "F"; gradePoint = 0.0; }

            return new
            {
                moduleId = e.CourseId,
                moduleTitle = e.Course?.Title ?? "Unknown",
                category = e.Course?.Category ?? "General",
                assignmentAvg = Math.Round(hwAvg, 1),
                quizAvg = 0.0,
                attendancePercent = 0.0,
                finalScore = Math.Round(finalScore, 1),
                letterGrade,
                gradePoint,
                progress = e.Progress
            };
        }).ToList();

        var gpa = modules.Any() ? Math.Round(modules.Average(m => m.gradePoint), 2) : 0.0;

        return Ok(new
        {
            studentName = student.FullName,
            studentEmail = student.Email,
            modules,
            gpa,
            totalModules = modules.Count,
            completedModules = modules.Count(m => m.progress >= 100)
        });
    }
}
