using AutoMapper;
using Dawn.Core.DTOs;
using Dawn.Core.Common;
using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Dawn.Infrastructure.Data;
using Dawn.Infrastructure.Services;
using Dawn.Api.Services;
using Dawn.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly IGenericRepository<Course> _repo;
        private readonly IMapper _mapper;
        private readonly ApplicationDbContext _context;
        private readonly INativeSearchService _searchService;
        private readonly IFileService _fileService;
        private readonly ICacheService _cache;

        public CoursesController(
            IGenericRepository<Course> repo,
            IMapper mapper,
            ApplicationDbContext context,
            INativeSearchService searchService,
            IFileService fileService,
            ICacheService cache)
        {
            _repo = repo;
            _mapper = mapper;
            _context = context;
            _searchService = searchService;
            _fileService = fileService;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string search = "", [FromQuery] string category = "")
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 50) limit = 10;

            var cacheKey = $"Courses_List_P{page}_L{limit}_S{search ?? ""}_C{category ?? ""}";
            var cachedResponse = await _cache.GetAsync<PagedResult<CourseDto>>(cacheKey);
            if (cachedResponse != null) return Ok(cachedResponse);

            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var query = _context.Courses.Where(c => !c.IsArchived).AsQueryable();

            // Draft Mode Filtering: If not admin/instructor of the course, only show published ones
            if (userRole?.ToLower() != "admin")
            {
                query = query.Where(c => c.IsPublished || c.InstructorId == userId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(c => c.Title.ToLower().Contains(lowerSearch) || c.Description.ToLower().Contains(lowerSearch));
            }

            if (!string.IsNullOrWhiteSpace(category) && category != "All")
            {
                query = query.Where(c => c.Category == category);
            }

            var totalCount = await query.CountAsync();
            var courses = await query
                .OrderByDescending(c => c.Id)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // Resolve instructor names in one query
            var instructorIds = courses.Select(c => c.InstructorId).Distinct().ToList();
            var instructorNames = await _context.Users
                .Where(u => instructorIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName })
                .ToDictionaryAsync(u => u.Id, u => u.FullName);

            var dtos = courses.Select(c =>
            {
                var dto = _mapper.Map<CourseDto>(c);
                dto.InstructorName = instructorNames.TryGetValue(c.InstructorId, out var name) ? name : null;
                return dto;
            }).ToList();

            var result = new PagedResult<CourseDto>(dtos, totalCount, page, limit);

            await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));

            return Ok(result);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDto>> GetCourse(int id)
        {
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null) return NotFound("Course not found.");

            return Ok(_mapper.Map<CourseDto>(course));
        }

        [HttpGet("recommended")]
        public async Task<ActionResult<IReadOnlyList<CourseDto>>> GetRecommended()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Get all courses
            var allCourses = await _context.Courses.ToListAsync();

            // Get this student's enrolled course IDs
            var enrolledCourseIds = await _context.Enrollments
                .Where(e => e.StudentId == userId)
                .Select(e => e.CourseId)
                .ToListAsync();

            var enrolledCourses = allCourses.Where(c => enrolledCourseIds.Contains(c.Id)).ToList();

            if (!enrolledCourses.Any())
            {
                // No enrollments → return top 5 newest courses as default recs
                var newest = allCourses.OrderByDescending(c => c.Id).Take(5).ToList();
                return Ok(_mapper.Map<IReadOnlyList<CourseDto>>(newest));
            }

            // Use native TF-IDF content-based recommendations
            var recommendedIds = _searchService.GetContentBasedRecommendations(enrolledCourses, allCourses, 5);

            var recommendedCourses = allCourses
                .Where(c => recommendedIds.Contains(c.Id))
                .ToList();

            // If ML didn't find enough, pad with popular courses
            if (recommendedCourses.Count < 3)
            {
                var extras = allCourses
                    .Where(c => !enrolledCourseIds.Contains(c.Id) && !recommendedIds.Contains(c.Id))
                    .OrderByDescending(c => c.Id)
                    .Take(5 - recommendedCourses.Count)
                    .ToList();
                recommendedCourses.AddRange(extras);
            }

            return Ok(_mapper.Map<IReadOnlyList<CourseDto>>(recommendedCourses));
        }

        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse([FromForm] CourseCreateRequestDto courseDto)
        {
            // 1. Extract the User ID and Role from the JWT Claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // 2. Safety check
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token. Please log in again.");

            // 3. Determine the effective instructor:
            //    - If Admin provides an AssignedInstructorId, use that teacher.
            //    - Otherwise, the current user (Teacher or Admin) owns the course.
            string effectiveInstructorId = userId;
            if (userRole?.ToLower() == "admin" && !string.IsNullOrWhiteSpace(courseDto.AssignedInstructorId))
            {
                // Verify the assigned user actually exists and is a Teacher
                var assignedUser = await _context.Users.FindAsync(courseDto.AssignedInstructorId);
                if (assignedUser == null || assignedUser.Role?.ToLower() != "teacher")
                    return BadRequest("Assigned instructor not found or is not a Teacher.");
                effectiveInstructorId = courseDto.AssignedInstructorId;
            }

            // 4. Build the Course entity
            var course = new Course
            {
                Title = courseDto.Title,
                Description = courseDto.Description,
                Category = string.IsNullOrWhiteSpace(courseDto.Category) ? "Uncategorized" : courseDto.Category,
                InstructorId = effectiveInstructorId,
                IsSequential = courseDto.IsSequential,
                IsPublished = courseDto.IsPublished
            };

            // 5. Handle Thumbnail Upload if present
            if (courseDto.ThumbnailFile != null && courseDto.ThumbnailFile.Length > 0)
            {
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                course.ThumbnailUrl = await _fileService.SaveFileAsync(courseDto.ThumbnailFile, allowedExtensions, "thumbnails");
            }

            // 6. Persist to Database
            await _repo.AddAsync(course);
            await _repo.SaveChangesAsync();

            // 7. Invalidate Cache
            await _cache.RemoveByPrefixAsync("Courses_List_");

            return Ok(_mapper.Map<CourseDto>(course));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult<CourseDto>> UpdateCourse(int id, [FromForm] CourseUpdateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound("Course not found");

            if (course.InstructorId != userId && userRole?.ToLower() != "admin")
                return Forbid("You do not have permission to edit this course.");

            course.Title = dto.Title ?? course.Title;
            course.Description = dto.Description ?? course.Description;
            course.Category = dto.Category ?? course.Category;
            course.IsSequential = dto.IsSequential;
            course.IsPublished = dto.IsPublished;

            if (dto.ThumbnailFile != null && dto.ThumbnailFile.Length > 0)
            {
                // Delete old thumbnail if it isn't an external HTTP link
                if (!string.IsNullOrEmpty(course.ThumbnailUrl) && !course.ThumbnailUrl.StartsWith("http"))
                {
                    _fileService.DeleteFile(course.ThumbnailUrl);
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                course.ThumbnailUrl = await _fileService.SaveFileAsync(dto.ThumbnailFile, allowedExtensions, "thumbnails");
            }

            _context.Courses.Update(course);
            await _context.SaveChangesAsync();

            // Invalidate Cache
            await _cache.RemoveByPrefixAsync("Courses_List_");

            return Ok(_mapper.Map<CourseDto>(course));
        }

        [HttpPut("{id}/assign-teacher")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> AssignTeacher(int id, [FromBody] AssignTeacherDto dto)
        {
            // Get admin user ID for audit trail
            var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(adminUserId))
                return Unauthorized(new { Message = "User ID not found in token." });

            // Verify course exists
            var course = await _context.Courses.FindAsync(id);
            if (course == null) 
                return NotFound(new { Message = "Module not found" });

            // Validate teacher exists
            var teacher = await _context.Users.FindAsync(dto.TeacherId);
            if (teacher == null)
                return BadRequest(new { Message = "Teacher not found." });
            
            // Validate user has Teacher role
            if (teacher.Role != "Teacher")
                return BadRequest(new { Message = "User is not a Teacher." });

            // Store previous teacher ID for audit trail
            var previousTeacherId = course.InstructorId;

            // Update course assignment
            course.InstructorId = dto.TeacherId;
            _context.Courses.Update(course);

            // Create audit log entry
            var auditEntry = new CourseAssignmentAudit
            {
                CourseId = id,
                PreviousTeacherId = previousTeacherId,
                NewTeacherId = dto.TeacherId,
                AdminUserId = adminUserId,
                AssignedAt = DateTime.UtcNow
            };
            _context.CourseAssignmentAudits.Add(auditEntry);

            // Save changes atomically
            await _context.SaveChangesAsync();
            
            // Invalidate cache
            await _cache.RemoveByPrefixAsync("Courses_List_");
            
            return Ok(new { Message = $"Module assigned to {teacher.FullName}." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> ArchiveCourse(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound("Course not found");

            if (course.InstructorId != userId && userRole?.ToLower() != "admin")
                return Forbid("You do not have permission to delete this course.");

            course.IsArchived = true;
            _context.Courses.Update(course);
            await _context.SaveChangesAsync();

            // Invalidate Cache
            await _cache.RemoveByPrefixAsync("Courses_List_");

            return Ok(new { message = "Course archived successfully." });
        }

        [HttpDelete("{id}/permanent")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> PermanentlyDeleteCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Lessons)
                .Include(c => c.Assignments)
                .Include(c => c.Quizzes)
                .Include(c => c.Enrollments)
                .Include(c => c.Announcements)
                .Include(c => c.LiveClasses)
                .Include(c => c.AttendanceRecords)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null) 
                return NotFound(new { Message = "Course not found" });

            // Delete thumbnail if it exists
            if (!string.IsNullOrEmpty(course.ThumbnailUrl) && !course.ThumbnailUrl.StartsWith("http"))
            {
                _fileService.DeleteFile(course.ThumbnailUrl);
            }

            // Delete all related entities (cascade delete should handle most, but we'll be explicit)
            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            // Invalidate Cache
            await _cache.RemoveByPrefixAsync("Courses_List_");

            return Ok(new { Message = $"Course '{course.Title}' has been permanently deleted." });
        }
    }
}
