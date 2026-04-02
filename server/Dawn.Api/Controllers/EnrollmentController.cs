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
        /// Enroll the current student in a course.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> Enroll(EnrollmentCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            // Check if course exists
            var course = await _context.Courses.FindAsync(dto.CourseId);
            if (course == null)
                return NotFound(new { Message = "Course not found." });

            if (course.Price > 0)
                return BadRequest(new { Message = "This is a paid course. Please use the payment gateway." });

            // Check for duplicate enrollment
            var alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == userId && e.CourseId == dto.CourseId);

            if (alreadyEnrolled)
                return BadRequest(new { Message = "You are already enrolled in this course." });

            var enrollment = new Enrollment
            {
                StudentId = userId,
                CourseId = dto.CourseId,
                EnrolledAt = DateTime.UtcNow,
                Progress = 0
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            // Send Welcome Notification
            await _notificationService.CreateNotificationAsync(
                userId, 
                "Course Enrollment Successful", 
                $"Welcome to '{course.Title}'! You have successfully enrolled and can now access all course materials."
            );

            // Reload with Course data for the DTO mapping
            var created = await _context.Enrollments
                .Include(e => e.Course)
                .FirstAsync(e => e.Id == enrollment.Id);

            return Ok(_mapper.Map<EnrollmentDto>(created));
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

            // Only the course instructor or an admin can view enrolled students
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null)
                return NotFound(new { Message = "Course not found." });

            if (course.InstructorId != userId && userRole?.ToLower() != "admin")
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

            var enrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == userId && e.CourseId == courseId);

            return Ok(new { isEnrolled = enrolled });
        }
    }
}
