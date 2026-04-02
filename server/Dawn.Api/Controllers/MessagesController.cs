using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Dawn.Core.Entities;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MessagesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all conversations (unique users the current user has chatted with) with last message preview.
    /// </summary>
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        // Get all messages involving the current user
        var messages = await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        // Group by other user
        var conversations = messages
            .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
            .Select(g =>
            {
                var otherUserId = g.Key;
                var lastMsg = g.First();
                var otherUser = lastMsg.SenderId == userId ? lastMsg.Receiver : lastMsg.Sender;
                var unreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead);

                return new
                {
                    UserId = otherUserId,
                    FullName = otherUser.FullName,
                    Email = otherUser.Email,
                    Role = otherUser.Role,
                    LastMessage = lastMsg.Content,
                    LastMessageTime = lastMsg.CreatedAt,
                    UnreadCount = unreadCount
                };
            })
            .OrderByDescending(c => c.LastMessageTime)
            .ToList();

        return Ok(conversations);
    }

    /// <summary>
    /// Get chat history with a specific user.
    /// </summary>
    [HttpGet("history/{otherUserId}")]
    public async Task<IActionResult> GetHistory(string otherUserId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var messages = await _context.Messages
            .Include(m => m.Sender)
            .Where(m =>
                (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                (m.SenderId == otherUserId && m.ReceiverId == userId))
            .OrderBy(m => m.CreatedAt)
            .Select(m => new
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = m.Sender.FullName,
                ReceiverId = m.ReceiverId,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                IsRead = m.IsRead
            })
            .ToListAsync();

        return Ok(messages);
    }

    /// <summary>
    /// Mark all messages from a specific user as read.
    /// </summary>
    [HttpPost("mark-read/{otherUserId}")]
    public async Task<IActionResult> MarkAsRead(string otherUserId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var unread = await _context.Messages
            .Where(m => m.SenderId == otherUserId && m.ReceiverId == userId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unread)
            msg.IsRead = true;

        await _context.SaveChangesAsync();
        return Ok(new { MarkedRead = unread.Count });
    }

    /// <summary>
    /// Search for users to start a new conversation.
    /// </summary>
    [HttpGet("users/search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string q)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(Array.Empty<object>());

        var users = await _context.Users
            .Where(u => u.Id != userId &&
                        (u.FullName.Contains(q) || u.Email!.Contains(q)))
            .Take(10)
            .Select(u => new
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Get total unread message count for the current user (for badge).
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var count = await _context.Messages
            .CountAsync(m => m.ReceiverId == userId && !m.IsRead);
        return Ok(count);
    }
}
