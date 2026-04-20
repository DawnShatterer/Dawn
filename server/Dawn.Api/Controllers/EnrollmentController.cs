using AutoMapper;
using Dawn.Core.DTOs;
using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
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
    public class EnrollmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;

        public EnrollmentsController(ApplicationDbContext context, IMapper mapper, INotificationService notificationService)
        {
            _context = context;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Self-enrollment is disabled in institutional LMS mode.
        /// Module assignment is handled by Staff via bulk-enroll.
        /// </summary>
        [HttpPost]
        public IActionResult Enroll()
        {
            return BadRequest(new { Message = "Self-enrollment is disabled. Module assignments are managed by institutional staff." });
        }

        /// <summary>
        /// Unenroll the current student from a course.
        /// </summary>
        [HttpDelete("{courseId}")]
        public async Task<ActionResult> Unenroll(int courseId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == userId && e.CourseId == courseId);

            if (enrollment == null)
                return NotFound(new { Message = "You are not enrolled in this course." });

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Successfully unenrolled." });
        }

        /// <summary>
        /// Get all courses the current student is enrolled in.
        /// </summary>
        [HttpGet("my")]
        public async Task<ActionResult<List<EnrollmentDto>>> GetMyEnrollments()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var enrollments = await _context.Enrollments
                .Where(e => e.StudentId == userId)
                .Include(e => e.Course)
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();

            return Ok(_mapper.Map<List<EnrollmentDto>>(enrollments));
        }

        /// <summary>
        /// Get all students enrolled in a specific course (for teachers).
        /// </summary>
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<List<EnrollmentStudentDto>>> GetCourseStudents(int courseId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Only the course instructor, admin, or staff can view enrolled students
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null)
                return NotFound(new { Message = "Course not found." });

            if (course.InstructorId != userId && userRole?.ToLower() != "admin" && userRole?.ToLower() != "staff")
                return Forbid();

            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == courseId)
                .Include(e => e.Student)
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();

            return Ok(_mapper.Map<List<EnrollmentStudentDto>>(enrollments));
        }

        /// <summary>
        /// Check if the current user is enrolled in a specific course.
        /// </summary>
        [HttpGet("check/{courseId}")]
        public async Task<ActionResult> CheckEnrollment(int courseId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == userId && e.CourseId == courseId);

            return Ok(new { 
                isEnrolled = enrollment != null,
                progress = enrollment?.Progress ?? 0
            });
        }

        [HttpPost("bulk-enroll")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> BulkEnroll([FromBody] BulkEnrollDto dto)
        {
            // Validate course exists
            var course = await _context.Courses.FindAsync(dto.CourseId);
            if (course == null)
            {
                return NotFound(new { Message = "Course not found." });
            }

            // Validate batch exists
            var batch = await _context.Batches.FindAsync(dto.BatchId);
            if (batch == null)
            {
                return NotFound(new { Message = "Batch not found." });
            }

            // Find all students in this batch (only users with "Student" role)
            var studentsInBatch = await _context.Users
                .Where(u => u.BatchId == dto.BatchId && u.Role == "Student")
                .Select(u => u.Id)
                .ToListAsync();

            // Handle empty batch case
            if (!studentsInBatch.Any())
            {
                return Ok(new { enrolled = 0, skipped = 0, total = 0, message = "No students found in this batch." });
            }

            // Find existing enrollments for these students in this course
            var existingEnrollments = await _context.Enrollments
                .Where(e => e.CourseId == dto.CourseId && studentsInBatch.Contains(e.StudentId))
                .Select(e => e.StudentId)
                .ToListAsync();

            // Determine who needs to be enrolled (prevent duplicates)
            var studentsToEnroll = studentsInBatch.Except(existingEnrollments).ToList();

            // Create new enrollment records
            var newEnrollments = studentsToEnroll.Select(studentId => new Enrollment
            {
                StudentId = studentId,
                CourseId = dto.CourseId,
                EnrolledAt = DateTime.UtcNow,
                Progress = 0
            }).ToList();

            // Only write to database if there are new enrollments
            if (newEnrollments.Any())
            {
                _context.Enrollments.AddRange(newEnrollments);
                await _context.SaveChangesAsync();
            }

            // Return counts (enrolled + skipped = total)
            return Ok(new 
            { 
                enrolled = studentsToEnroll.Count, 
                skipped = existingEnrollments.Count, 
                total = studentsInBatch.Count,
                message = $"Successfully assigned {studentsToEnroll.Count} students to {course.Title}."
            });
        }
    }
}
