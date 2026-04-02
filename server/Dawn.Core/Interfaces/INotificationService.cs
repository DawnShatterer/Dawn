namespace Dawn.Core.Interfaces;

public interface INotificationService
{
    Task CreateNotificationAsync(string userId, string title, string message);
    Task NotifyCourseStudentsAsync(int courseId, string title, string message);
}
