using AutoMapper;
using Dawn.Core.DTOs;
using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        public CoursesController(IGenericRepository<Course> repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<CourseDto>>> GetCourses()
        {
            var courses = await _repo.GetAllAsync();
            return Ok(_mapper.Map<IReadOnlyList<CourseDto>>(courses));
        }

        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse(CourseCreateDto courseDto)
        {
            // 1. Extract the User ID from the JWT Claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 2. Safety check to prevent the "InstructorId cannot be null" SQL error
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token. Please log in again.");
            }

            // 3. Map DTO to Entity
            var course = _mapper.Map<Course>(courseDto);

            // 4. Assign the InstructorId from the authenticated user
            course.InstructorId = userId;

            // 5. Persist to Database via Generic Repository
            await _repo.AddAsync(course);
            await _repo.SaveChangesAsync();

            // 6. Return the mapped CourseDto
            return Ok(_mapper.Map<CourseDto>(course));
        }
    }
}