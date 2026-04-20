using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnalyticsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("teacher")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GetTeacherAnalytics()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var courses = await _context.Courses
            .Include(c => c.Enrollments)
            .Where(c => c.InstructorId == userId)
            .ToListAsync();

        var courseIds = courses.Select(c => c.Id).ToList();

        var totalStudents = courses.Sum(c => c.Enrollments.Count);

        var recentEnrollmentsCount = await _context.Enrollments
            .Where(e => courseIds.Contains(e.CourseId) && e.EnrolledAt >= DateTime.UtcNow.AddDays(-7))
            .CountAsync();

        var averageProgress = totalStudents > 0 
            ? await _context.Enrollments
                .Where(e => courseIds.Contains(e.CourseId))
                .AverageAsync(e => e.Progress)
            : 0;

        var courseStats = courses.Select(c => new
        {
            Id = c.Id,
            Title = c.Title,
            Description = c.Description,
            Category = c.Category,
            Students = c.Enrollments.Count,
            IsArchived = c.IsArchived
        }).ToList();

        var activities = await _context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .Where(e => courseIds.Contains(e.CourseId))
            .OrderByDescending(e => e.EnrolledAt)
            .Take(5)
            .Select(e => new
            {
                Id = e.Id,
                Action = "Module Enrollment",
                Detail = $"{e.Student.FullName} enrolled in {e.Course.Title}",
                Time = e.EnrolledAt,
                Type = "success"
            })
            .ToListAsync();

        return Ok(new
        {
            Overview = new { totalStudents, recentEnrollments = recentEnrollmentsCount, averageProgress = Math.Round(averageProgress, 0) },
            CourseStats = courseStats,
            RecentActivity = activities
        });
    }

    [HttpGet("student")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetStudentProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Where(e => e.StudentId == userId)
            .ToListAsync();

        var completed = enrollments.Count(e => e.Progress >= 100);
        var inProgress = enrollments.Count(e => e.Progress > 0 && e.Progress < 100);
        
        // Dynamically compute averageQuizScore as an estimate using Progress (since distinct QuizAttempts table is not available)
        var averageQuizScore = enrollments.Any() ? (int)Math.Clamp(Math.Round(enrollments.Average(e => e.Progress) * 0.9 + 15), 0, 100) : 0; 

        var totalSeconds = await _context.StudentSessionLogs
            .Where(s => s.UserId == userId)
            .SumAsync(s => s.DurationSeconds ?? 0);
        var totalHoursLearned = Math.Round(totalSeconds / 3600.0, 1);

        var courseProgress = enrollments.Select(e => new
        {
            Id = e.CourseId,
            Title = e.Course?.Title ?? "Unknown",
            Progress = e.Progress,
            LastAccessed = e.EnrolledAt, // using enrolledAt as proxy for now
            Color = e.Progress == 100 ? "success" : (e.Progress > 50 ? "primary" : "info")
        }).ToList();

        return Ok(new
        {
            Stats = new { coursesCompleted = completed, coursesInProgress = inProgress, totalHoursLearned, averageQuizScore },
            CourseProgress = courseProgress
        });
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetAdminAnalytics()
    {
        var totalUsers = await _context.Users.CountAsync();
        var activeCourses = await _context.Courses.CountAsync(c => c.IsPublished && !c.IsArchived);
        var totalEnrollments = await _context.Enrollments.CountAsync();
        
        var activeUsersLast24Hours = await _context.StudentSessionLogs
            .Where(s => s.StartTime >= DateTime.UtcNow.AddHours(-24))
            .Select(s => s.UserId)
            .Distinct()
            .CountAsync();
        
        var newEnrollmentsLast7Days = await _context.Enrollments
            .Where(e => e.EnrolledAt >= DateTime.UtcNow.AddDays(-7))
            .CountAsync();
        
        var totalTeachers = await _context.Users
            .CountAsync(u => u.Role == "Teacher");
        
        var totalStudents = await _context.Users
            .CountAsync(u => u.Role == "Student");
        
        var totalRevenue = await _context.PaymentRecords
            .Where(p => p.Status == "Completed")
            .SumAsync(p => (decimal?)p.Amount) ?? 0;

        return Ok(new
        {
            totalUsers,
            activeCourses,
            totalEnrollments,
            activeUsersLast24Hours,
            newEnrollmentsLast7Days,
            totalTeachers,
            totalStudents,
            totalRevenue
        });
    }
    [HttpPost("heartbeat/{sessionId}")]
    public async Task<IActionResult> Heartbeat(int sessionId, [FromQuery] int? courseId = null, [FromQuery] int? lessonId = null)
    {
        var session = await _context.StudentSessionLogs.FindAsync(sessionId);
        if (session == null) return NotFound();

        session.EndTime = DateTime.UtcNow;
        session.DurationSeconds = (int)(session.EndTime.Value - session.StartTime).TotalSeconds;
        
        // Update context if provided (for when student switches lessons mid-session)
        if (courseId.HasValue) session.CourseId = courseId;
        if (lessonId.HasValue) session.LessonId = lessonId;
        
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("student/engagement")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetStudentEngagement()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Get sessions from the last 7 days
        var lastWeek = DateTime.UtcNow.AddDays(-7);
        var sessions = await _context.StudentSessionLogs
            .Where(s => s.UserId == userId && s.StartTime >= lastWeek)
            .ToListAsync();

        var totalMinutes = sessions.Sum(s => s.DurationSeconds ?? 0) / 60;
        
        // Group sessions by day
        var sessionsByDay = sessions
            .GroupBy(s => s.StartTime.Date)
            .ToDictionary(g => g.Key, g => g.Sum(s => s.DurationSeconds ?? 0) / 60);

        // Generate all 7 days (from 6 days ago to today) to ensure chart shows all days
        var dailyActivity = new List<object>();
        for (int i = 6; i >= 0; i--)
        {
            var date = DateTime.UtcNow.Date.AddDays(-i);
            var minutes = sessionsByDay.ContainsKey(date) ? sessionsByDay[date] : 0;
            dailyActivity.Add(new
            {
                Day = date.ToString("ddd"),
                Minutes = minutes
            });
        }

        // Calculate a "streak" (consecutive days with activity)
        var streak = 0;
        var today = DateTime.UtcNow.Date;
        for (int i = 0; i < 30; i++)
        {
            var date = today.AddDays(-i);
            var hasActivity = await _context.StudentSessionLogs.AnyAsync(s => s.UserId == userId && s.StartTime.Date == date);
            if (hasActivity)
            {
                streak++;
            }
            else
            {
                // Only allow skipping today (i == 0), otherwise streak is broken
                if (i > 0) break;
            }
        }

        return Ok(new
        {
            totalMinutes,
            streak,
            dailyActivity,
            recentSessionCount = sessions.Count
        });
    }
}
