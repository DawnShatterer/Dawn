using Dawn.Core.Interfaces;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace Dawn.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        ApplicationDbContext context,
        ICacheService cache,
        ILogger<HealthController> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Check database connectivity
            var dbHealthy = await CheckDatabaseHealth();

            // Check cache connectivity
            var cacheHealthy = await CheckCacheHealth();

            stopwatch.Stop();

            var overallHealthy = dbHealthy && cacheHealthy;

            var result = new
            {
                status = overallHealthy ? "healthy" : "degraded",
                database = dbHealthy ? "connected" : "disconnected",
                cache = cacheHealthy ? "connected" : "disconnected",
                timestamp = DateTime.UtcNow,
                responseTime = stopwatch.ElapsedMilliseconds
            };

            // Return 503 if critical services (database) are down
            if (!dbHealthy)
            {
                _logger.LogError("Health check failed: Database unavailable");
                return StatusCode(503, result);
            }

            // Cache failure is degraded but not critical
            if (!cacheHealthy)
            {
                _logger.LogWarning("Health check degraded: Cache unavailable");
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed with exception");
            stopwatch.Stop();

            return StatusCode(503, new
            {
                status = "unhealthy",
                database = "error",
                cache = "error",
                timestamp = DateTime.UtcNow,
                responseTime = stopwatch.ElapsedMilliseconds,
                error = ex.Message
            });
        }
    }

    private async Task<bool> CheckDatabaseHealth()
    {
        try
        {
            // Simple query to verify database connectivity
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return false;
        }
    }

    private async Task<bool> CheckCacheHealth()
    {
        try
        {
            var testKey = "health_check_test";
            var testValue = DateTime.UtcNow.Ticks.ToString();

            await _cache.SetAsync(testKey, testValue, TimeSpan.FromSeconds(10));
            var retrieved = await _cache.GetAsync<string>(testKey);
            await _cache.RemoveAsync(testKey);

            return retrieved == testValue;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache health check failed");
            return false;
        }
    }
}
