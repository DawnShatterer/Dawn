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
public class AnnouncementsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnnouncementsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all announcements for a specific course.
    /// Accessible by enrolled students and the course instructor.
    /// </summary>
    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetCourseAnnouncements(int courseId)
    {
        var announcements = await _context.Announcements
            .Include(a => a.Author)
            .Where(a => a.CourseId == courseId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Content,
                a.CreatedAt,
                AuthorName = a.Author.FullName,
                AuthorRole = a.Author.Role
            })
            .ToListAsync();

        return Ok(announcements);
    }

    /// <summary>
    /// Create a new announcement for a course. Only Teachers/Admins can do this.
    /// Automatically generates notifications for all enrolled students.
    /// </summary>
    [HttpPost("course/{courseId}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CreateAnnouncement(int courseId, [FromBody] AnnouncementCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        // Verify course exists and user is instructor (or admin)
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound("Course not found.");

        var userRole = User.FindFirstValue(ClaimTypes.Role);
        if (userRole != "Admin" && course.InstructorId != userId)
        {
            return Forbid("You are not the instructor of this course.");
        }

        var announcement = new Announcement
        {
            Title = dto.Title,
            Content = dto.Content,
            CourseId = courseId,
            AuthorId = userId
        };

        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        // Generate Notifications for all enrolled students
        var enrolledStudentIds = await _context.Enrollments
            .Where(e => e.CourseId == courseId)
            .Select(e => e.StudentId)
            .ToListAsync();

        var notifications = enrolledStudentIds.Select(studentId => new Notification
        {
            UserId = studentId,
            Title = $"New Announcement in {course.Title}",
            Message = $"Your instructor posted a new announcement: {announcement.Title}",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        if (notifications.Any())
        {
            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Announcement posted successfully and students notified." });
    }
}

public class AnnouncementCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
