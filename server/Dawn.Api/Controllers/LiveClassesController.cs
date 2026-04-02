using AutoMapper;
using Dawn.Core.DTOs;
using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LiveClassesController : ControllerBase
{
    private readonly IGenericRepository<LiveClass> _liveClassRepo;
    private readonly IGenericRepository<Course> _courseRepo;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public LiveClassesController(
        IGenericRepository<LiveClass> liveClassRepo,
        IGenericRepository<Course> courseRepo,
        IMapper mapper,
        INotificationService notificationService)
    {
        _liveClassRepo = liveClassRepo;
        _courseRepo = courseRepo;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    // GET: api/LiveClasses/course/5
    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetCourseLiveClasses(int courseId)
    {
        var allClasses = await _liveClassRepo.GetAllAsync();
        var classes = allClasses.Where(l => l.CourseId == courseId)
                                .OrderByDescending(l => l.StartTime >= DateTime.Now)
                                .ThenBy(l => l.StartTime)
                                .ToList();
                         
        var classesDto = _mapper.Map<IEnumerable<LiveClassDto>>(classes);
        return Ok(classesDto);
    }

    // POST: api/LiveClasses
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CreateLiveClass([FromBody] LiveClassCreateDto createDto)
    {
        var course = await _courseRepo.GetByIdAsync(createDto.CourseId);
        if (course == null)
            return NotFound("Course not found");

        var liveClass = _mapper.Map<LiveClass>(createDto);
        await _liveClassRepo.AddAsync(liveClass);
        await _liveClassRepo.SaveChangesAsync();

        // Notify enrolled students
        await _notificationService.NotifyCourseStudentsAsync(
            liveClass.CourseId, 
            "New Live Class Scheduled", 
            $"A new session '{liveClass.Title}' will begin on {liveClass.StartTime:MMM dd, yyyy h:mm tt}."
        );

        var dto = _mapper.Map<LiveClassDto>(liveClass);
        return CreatedAtAction(nameof(GetCourseLiveClasses), new { courseId = liveClass.CourseId }, dto);
    }

    // DELETE: api/LiveClasses/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> DeleteLiveClass(int id)
    {
        var liveClass = await _liveClassRepo.GetByIdAsync(id);
        if (liveClass == null)
            return NotFound("Live class not found");

        _liveClassRepo.Delete(liveClass);
        await _liveClassRepo.SaveChangesAsync();
        return NoContent();
    }
}
