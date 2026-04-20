using AutoMapper;
using Dawn.Api.Services;
using Dawn.Api.DTOs;
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
    public class LessonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;
        private readonly INotificationService _notificationService;

        public LessonsController(
            ApplicationDbContext context, 
            IMapper mapper, 
            IFileService fileService,
            INotificationService notificationService)
        {
            _context = context;
            _mapper = mapper;
            _fileService = fileService;
            _notificationService = notificationService;
        }

        [AllowAnonymous]
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<List<LessonDto>>> GetCourseLessons(int courseId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound("Course not found");

            bool isEnrolledOrAdmin = false;
            if (userId != null)
            {
                if (course.InstructorId == userId || userRole?.ToLower() == "admin")
                {
                    isEnrolledOrAdmin = true;
                }
                else
                {
                    isEnrolledOrAdmin = await _context.Enrollments.AnyAsync(e => e.StudentId == userId && e.CourseId == courseId);
                }
            }

            var lessons = await _context.Lessons
                .Where(l => l.CourseId == courseId)
                .OrderBy(l => l.Order)
                .ToListAsync();

            var lessonDtos = _mapper.Map<List<LessonDto>>(lessons);

            // Hide content for non-enrolled users unless it's a free preview
            if (!isEnrolledOrAdmin)
            {
                foreach (var dto in lessonDtos)
                {
                    if (!dto.IsFreePreview)
                    {
                        dto.IsLocked = true;
                        dto.VideoUrl = null;
                        dto.PdfUrl = null;
                        dto.PptUrl = null;
                    }
                }
            }

            // Apply sequential locking logic for students
            if (course.IsSequential && userRole?.ToLower() == "student")
            {
                var completedLessonIds = await _context.LessonProgresses
                    .Where(lp => lp.StudentId == userId && lp.IsCompleted)
                    .Select(lp => lp.LessonId)
                    .ToListAsync();

                bool previousCompleted = true; // The first lesson is always unlocked

                foreach (var dto in lessonDtos)
                {
                    if (!previousCompleted)
                    {
                        dto.IsLocked = true;
                        // Hide content for locked lessons
                        dto.VideoUrl = null;
                        dto.PdfUrl = null;
                        dto.PptUrl = null;
                    }

                    // For the next iteration, check if THIS lesson is completed
                    previousCompleted = completedLessonIds.Contains(dto.Id);
                }
            }

            return Ok(lessonDtos);
        }

        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        [RequestSizeLimit(104857600)] // 100MB
        public async Task<ActionResult<LessonDto>> CreateLesson([FromForm] LessonCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var course = await _context.Courses.FindAsync(dto.CourseId);
            
            if (course == null) return NotFound("Course not found");
            if (course.InstructorId != userId) return Forbid();

            // Syllabus Integrity Lock: Prevent adding lessons if anyone has already graduated
            var anyoneGraduated = await _context.Enrollments
                .AnyAsync(e => e.CourseId == dto.CourseId && e.Progress >= 100);
            
            if (anyoneGraduated)
            {
                return BadRequest("This course syllabus is locked because students have already completed the module. Adding lessons now would invalidate their completion status.");
            }

            string? videoUrl = null;
            string? pdfUrl = null;
            string? pptUrl = null;

            try
            {
                // Video: prefer URL string (YouTube/Drive link), fallback to file upload
                if (!string.IsNullOrWhiteSpace(dto.VideoUrl))
                {
                    videoUrl = dto.VideoUrl.Trim();
                }
                else if (dto.VideoFile != null)
                {
                    videoUrl = await _fileService.SaveFileAsync(dto.VideoFile, new[] { ".mp4", ".mkv", ".webm" }, "videos");
                }

                if (dto.PdfFile != null)
                {
                    pdfUrl = await _fileService.SaveFileAsync(dto.PdfFile, new[] { ".pdf" }, "pdfs");
                }

                if (dto.PptFile != null)
                {
                    pptUrl = await _fileService.SaveFileAsync(dto.PptFile, new[] { ".ppt", ".pptx" }, "presentations");
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"File upload error: {ex.Message}");
            }

            var lesson = new Lesson
            {
                Title = dto.Title,
                Description = dto.Description,
                Order = dto.Order,
                CompletionWeight = dto.CompletionWeight,
                CourseId = dto.CourseId,
                VideoUrl = videoUrl,
                PdfUrl = pdfUrl,
                PptUrl = pptUrl,
                IsFreePreview = dto.IsFreePreview
            };

            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();

            // Auto-notify all enrolled students
            await _notificationService.NotifyCourseStudentsAsync(
                lesson.CourseId,
                $"New Lesson in {course.Title}",
                $"A new lesson '{lesson.Title}' has been added. Check it out!"
            );

            return Ok(_mapper.Map<LessonDto>(lesson));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult> DeleteLesson(int id)
        {
            var lesson = await _context.Lessons.Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == id);
            
            if (lesson == null) return NotFound("Lesson not found");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (lesson.Course.InstructorId != userId) return Forbid();

            // Syllabus Integrity Lock: Prevent deleting lessons if anyone has already graduated
            var anyoneGraduated = await _context.Enrollments
                .AnyAsync(e => e.CourseId == lesson.CourseId && e.Progress >= 100);
            
            if (anyoneGraduated)
            {
                return BadRequest("This course syllabus is locked because students have already completed the module. Deleting lessons now would invalidate their completion status.");
            }

            // Delete physical files
            if (!string.IsNullOrEmpty(lesson.VideoUrl) && !lesson.VideoUrl.StartsWith("http"))
                _fileService.DeleteFile(lesson.VideoUrl);
                
            if (!string.IsNullOrEmpty(lesson.PdfUrl))
                _fileService.DeleteFile(lesson.PdfUrl);

            if (!string.IsNullOrEmpty(lesson.PptUrl))
                _fileService.DeleteFile(lesson.PptUrl);

            _context.Lessons.Remove(lesson);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Lesson deleted successfully" });
        }
    }
}
