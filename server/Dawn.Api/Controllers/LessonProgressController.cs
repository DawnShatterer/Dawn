using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LessonProgressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LessonProgressController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Mark a lesson as completed for the current student.
        /// </summary>
        [HttpPost("complete/{lessonId}")]
        public async Task<IActionResult> CompleteLesson(int lessonId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // 1. Verify the lesson exists
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);
            if (lesson == null) return NotFound("Lesson not found.");

            // 1b. Validate Enrollment (IDOR Protection)
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (userRole?.ToLower() != "admin" && lesson.Course.InstructorId != userId)
            {
                var isEnrolled = await _context.Enrollments.AnyAsync(e => e.StudentId == userId && e.CourseId == lesson.CourseId);
                if (!isEnrolled) return Forbid("You must be enrolled in this course to complete its lessons.");
            }

            // 2. Already completed?
            var existing = await _context.LessonProgresses
                .FirstOrDefaultAsync(lp => lp.StudentId == userId && lp.LessonId == lessonId);

            if (existing == null)
            {
                var progress = new LessonProgress
                {
                    StudentId = userId,
                    LessonId = lessonId,
                    IsCompleted = true,
                    CompletedAt = DateTime.UtcNow
                };
                _context.LessonProgresses.Add(progress);
            }
            else
            {
                existing.IsCompleted = true;
                existing.CompletedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // 3. Recalculate Course Progress for Enrollment
            await RecalculateCourseProgress(userId, lesson.CourseId);

            return Ok(new { Message = "Lesson marked as complete." });
        }

        /// <summary>
        /// Get the completion status of all lessons in a course for the current student.
        /// </summary>
        [HttpGet("status/{courseId}")]
        public async Task<IActionResult> GetCourseProgressStatus(int courseId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var completedLessonIds = await _context.LessonProgresses
                .Where(lp => lp.StudentId == userId && lp.Lesson.CourseId == courseId && lp.IsCompleted)
                .Select(lp => lp.LessonId)
                .ToListAsync();

            return Ok(completedLessonIds);
        }

        private async Task RecalculateCourseProgress(string studentId, int courseId)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

            if (enrollment == null) return;

            // Get completed lesson count
            var completedCount = await _context.LessonProgresses
                .CountAsync(lp => lp.StudentId == studentId && lp.Lesson.CourseId == courseId && lp.IsCompleted);

            // Fixed 10% per lesson completed, capped at 100%
            enrollment.Progress = Math.Min(completedCount * 10, 100);

            await _context.SaveChangesAsync();
        }
    }
}
