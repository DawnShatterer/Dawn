using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Dawn.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Dawn.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public NotificationService(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task CreateNotificationAsync(string userId, string title, string message)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Check if user has an email, then send it via Background job ideally,
        // but await here for simple logic.
        var user = await _context.Users.FindAsync(userId);
        if (user != null && !string.IsNullOrEmpty(user.Email))
        {
            await _emailService.SendEmailAsync(user.Email, title, message);
        }
    }

    public async Task NotifyCourseStudentsAsync(int courseId, string title, string message)
    {
        var enrollments = await _context.Enrollments
            .Include(e => e.Student)
            .Where(e => e.CourseId == courseId)
            .ToListAsync();

        var notifications = new List<Notification>();

        foreach (var enrollment in enrollments)
        {
            notifications.Add(new Notification
            {
                UserId = enrollment.StudentId,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });

            // Trigger mock email
            if (!string.IsNullOrEmpty(enrollment.Student.Email))
            {
                await _emailService.SendEmailAsync(enrollment.Student.Email, title, message);
            }
        }

        if (notifications.Any())
        {
            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }
    }
}
