using Dawn.Core.DTOs;
using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CourseReviewController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CourseReviewController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all reviews for a specific course. Publicly accessible.
    /// </summary>
    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetCourseReviews(int courseId)
    {
        var reviews = await _context.CourseReviews
            .Include(r => r.Student)
            .Where(r => r.CourseId == courseId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Score,
                r.Comment,
                r.CreatedAt,
                StudentName = r.Student != null ? r.Student.FullName : "Anonymous User"
            })
            .ToListAsync();

        return Ok(reviews);
    }

    /// <summary>
    /// Submits a new review for a course. Only enrolled students who haven't reviewed yet can post.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SubmitReview([FromBody] CreateReviewDto dto)
    {
        var studentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (studentId == null) return Unauthorized();

        // 1. Check if course exists
        var courseExists = await _context.Courses.AnyAsync(c => c.Id == dto.CourseId);
        if (!courseExists) return NotFound("Course not found.");

        // 2. Security Check: Is the student actually enrolled?
        var isEnrolled = await _context.Enrollments.AnyAsync(e => e.CourseId == dto.CourseId && e.StudentId == studentId);
        if (!isEnrolled) return BadRequest(new { Message = "You must be enrolled in this course to leave a review." });

        // 3. Security Check: Have they already reviewed it?
        var existingReview = await _context.CourseReviews.AnyAsync(r => r.CourseId == dto.CourseId && r.StudentId == studentId);
        if (existingReview) return BadRequest(new { Message = "You have already submitted a review for this course. You cannot review it again." });

        // 4. Validate score constraints natively
        if (dto.Score < 1 || dto.Score > 5) return BadRequest(new { Message = "Score must be between 1 and 5." });

        var review = new CourseReview
        {
            CourseId = dto.CourseId,
            StudentId = studentId,
            Score = dto.Score,
            Comment = dto.Comment?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.CourseReviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Review submitted successfully!" });
    }
}

public class CreateReviewDto
{
    public int CourseId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }
}
