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

        public CoursesController(
            IGenericRepository<Course> repo,
            IMapper mapper,
            ApplicationDbContext context,
            INativeSearchService searchService,
            IFileService fileService)
        {
            _repo = repo;
            _mapper = mapper;
            _context = context;
            _searchService = searchService;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string search = "")
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 50) limit = 10;

            var query = _context.Courses.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(c => c.Title.ToLower().Contains(lowerSearch) || c.Description.ToLower().Contains(lowerSearch));
            }

            var totalCount = await query.CountAsync();
            var courses = await query
                .OrderByDescending(c => c.Id)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var dtos = _mapper.Map<IReadOnlyList<CourseDto>>(courses);
            var result = new PagedResult<CourseDto>(dtos, totalCount, page, limit);

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDto>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Reviews)
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
            // 1. Extract the User ID from the JWT Claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 2. Safety check to prevent the "InstructorId cannot be null" SQL error
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token. Please log in again.");
            }

            // 3. Map DTO to Entity and apply Instructor ID
            var course = new Course
            {
                Title = courseDto.Title,
                Description = courseDto.Description,
                Price = courseDto.Price,
                InstructorId = userId
            };

            // 4. Handle Thumbnail Upload if present
            if (courseDto.ThumbnailFile != null && courseDto.ThumbnailFile.Length > 0)
            {
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                course.ThumbnailUrl = await _fileService.SaveFileAsync(courseDto.ThumbnailFile, allowedExtensions, "thumbnails");
            }

            // 5. Persist to Database via Generic Repository
            await _repo.AddAsync(course);
            await _repo.SaveChangesAsync();

            // 6. Return the mapped CourseDto
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
            course.Price = dto.Price; // Assumes passed from front-end

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

            return Ok(_mapper.Map<CourseDto>(course));
        }
    }
}