using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Dawn.Core.Entities;

namespace Dawn.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string receiverId, string content)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return;

        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Load sender info for the response
        var sender = await _context.Users.FindAsync(senderId);

        var messageDto = new
        {
            id = message.Id,
            senderId = message.SenderId,
            senderName = sender?.FullName ?? "Unknown",
            receiverId = message.ReceiverId,
            content = message.Content,
            createdAt = message.CreatedAt,
            isRead = message.IsRead
        };

        // Send to receiver in real-time
        await Clients.Group(receiverId).SendAsync("ReceiveMessage", messageDto);
        // Echo back to sender
        await Clients.Group(senderId).SendAsync("ReceiveMessage", messageDto);
    }

    public async Task MarkAsRead(string otherUserId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        var unread = await _context.Messages
            .Where(m => m.SenderId == otherUserId && m.ReceiverId == userId && !m.IsRead)
            .ToListAsync();

        foreach (var msg in unread)
            msg.IsRead = true;

        await _context.SaveChangesAsync();
    }
}
