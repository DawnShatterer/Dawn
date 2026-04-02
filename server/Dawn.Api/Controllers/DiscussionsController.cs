using AutoMapper;
using Dawn.Core.DTOs;
using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DiscussionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public DiscussionsController(
        ApplicationDbContext context, 
        IMapper mapper,
        INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetCourseThreads(int courseId)
    {
        var threads = await _context.DiscussionThreads
            .Include(t => t.Author)
            .Include(t => t.Replies) // Needed just for ReplyCount mapping
            .Where(t => t.CourseId == courseId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<DiscussionThreadDto>>(threads));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetThreadDetails(int id)
    {
        var thread = await _context.DiscussionThreads
            .Include(t => t.Author)
            .Include(t => t.Replies)
                .ThenInclude(r => r.Author)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (thread == null) return NotFound("Thread not found");

        return Ok(_mapper.Map<DiscussionThreadDetailDto>(thread));
    }

    [HttpPost]
    public async Task<IActionResult> CreateThread([FromBody] DiscussionThreadCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var thread = _mapper.Map<DiscussionThread>(dto);
        thread.AuthorId = userId;

        _context.DiscussionThreads.Add(thread);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Thread created successfully", ThreadId = thread.Id });
    }

    [HttpPost("{id}/reply")]
    public async Task<IActionResult> CreateReply(int id, [FromBody] DiscussionReplyCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var thread = await _context.DiscussionThreads.FindAsync(id);
        if (thread == null) return NotFound("Thread not found");

        var reply = _mapper.Map<DiscussionReply>(dto);
        reply.ThreadId = id;
        reply.AuthorId = userId;

        _context.DiscussionReplies.Add(reply);
        await _context.SaveChangesAsync();

        // Notify the thread author about the reply (if they aren't replying to themselves)
        if (thread.AuthorId != userId)
        {
            await _notificationService.CreateNotificationAsync(
                thread.AuthorId, 
                "New Reply", 
                $"Someone posted a new reply to your discussion thread '{thread.Title}'."
            );
        }

        return Ok(new { Message = "Reply posted successfully", ReplyId = reply.Id });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteThread(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var thread = await _context.DiscussionThreads.FindAsync(id);
        if (thread == null) return NotFound("Thread not found");

        // Only author or Teacher/Admin can delete
        if (thread.AuthorId != userId && userRole != "Teacher" && userRole != "Admin")
            return Forbid("You do not have permission to delete this thread");

        _context.DiscussionThreads.Remove(thread);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("reply/{id}")]
    public async Task<IActionResult> DeleteReply(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var reply = await _context.DiscussionReplies.FindAsync(id);
        if (reply == null) return NotFound("Reply not found");

        if (reply.AuthorId != userId && userRole != "Teacher" && userRole != "Admin")
            return Forbid("You do not have permission to delete this reply");

        _context.DiscussionReplies.Remove(reply);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
