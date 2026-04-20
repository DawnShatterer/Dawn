using Dawn.Infrastructure.Data;
using Dawn.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PublicController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cacheService;
    private const string StatsCacheKey = "platform_stats_v4";

    public PublicController(ApplicationDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetPlatformStats()
    {
        // Try cache first
        var cachedStats = await _cacheService.GetAsync<object>(StatsCacheKey);
        if (cachedStats != null) return Ok(cachedStats);

        // Serve real platform stats with the requested "ghost town" offsets
        var totalStudents = await _context.Users.CountAsync(u => u.Role == "Student");
        var totalEnrollments = await _context.Enrollments.CountAsync();
        var activeCourses = await _context.Courses.CountAsync();

        var averageRating = 4.9m;

        var topStudents = await _context.Users
            .Where(u => u.Role == "Student")
            .OrderBy(u => u.Id) 
            .Take(4)
            .Select(u => new { u.FullName, u.ProfilePictureUrl })
            .ToListAsync();

        var stats = new
        {
            students = totalStudents,
            enrollments = totalEnrollments,
            courses = activeCourses,
            averageRating = Math.Round(averageRating, 1),
            recentStudents = topStudents
        };

        // Cache for 30 mins to optimize homepage performance
        await _cacheService.SetAsync(StatsCacheKey, stats, TimeSpan.FromMinutes(30));

        return Ok(stats);
    }
}
