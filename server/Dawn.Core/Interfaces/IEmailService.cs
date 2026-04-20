namespace Dawn.Core.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendEmailWithAttachmentAsync(string to, string subject, string body, string attachmentName, byte[] attachmentBytes);
}
