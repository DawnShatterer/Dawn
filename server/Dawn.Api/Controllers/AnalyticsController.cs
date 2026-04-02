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

        // Get courses owned by the teacher
        var courses = await _context.Courses
            .Include(c => c.Enrollments)
            .Where(c => c.InstructorId == userId)
            .ToListAsync();

        var courseIds = courses.Select(c => c.Id).ToList();

        var totalStudents = courses.Sum(c => c.Enrollments.Count);
        var totalRevenue = courses.Sum(c => c.Enrollments.Count * c.Price);
        
        var recentEnrollmentsCount = await _context.Enrollments
            .Where(e => courseIds.Contains(e.CourseId) && e.EnrolledAt >= DateTime.UtcNow.AddDays(-7))
            .CountAsync();

        // Build precise course stats
        var courseStats = courses.Select(c => new
        {
            Id = c.Id,
            Title = c.Title,
            Students = c.Enrollments.Count,
            Revenue = c.Enrollments.Count * c.Price,
            Rating = 4.8m // Mock rating for now as we don't have a Reviews table
        }).ToList();

        // Recent Activity Feed
        var activities = await _context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .Where(e => courseIds.Contains(e.CourseId))
            .OrderByDescending(e => e.EnrolledAt)
            .Take(5)
            .Select(e => new
            {
                Id = e.Id,
                Action = "Course Enrollment",
                Detail = $"{e.Student.FullName} enrolled in {e.Course.Title}",
                Time = e.EnrolledAt,
                Type = "success"
            })
            .ToListAsync();

        return Ok(new
        {
            Overview = new { totalStudents, totalRevenue, recentEnrollments = recentEnrollmentsCount, averageRating = 4.8m },
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
        
        // Mock average score and hours learned as we do not accumulate session time currently
        var averageQuizScore = 85; 
        var totalHoursLearned = enrollments.Count * 12;

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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminAnalytics()
    {
        var totalUsers = await _context.Users.CountAsync();
        
        var totalRevenue = await _context.Enrollments
            .Include(e => e.Course)
            .SumAsync(e => e.Course != null ? e.Course.Price : 0);

        var activeCourses = await _context.Courses.CountAsync();
        var totalEnrollments = await _context.Enrollments.CountAsync();

        return Ok(new
        {
            totalUsers,
            totalRevenue,
            activeCourses,
            totalEnrollments,
            systemHealth = "99.9% Uptime"
        });
    }
}
