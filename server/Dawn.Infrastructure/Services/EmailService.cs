using Dawn.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Dawn.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var smptServer = _configuration["EmailSettings:SmtpServer"];
            var smtpPortString = _configuration["EmailSettings:SmtpPort"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderName = _configuration["EmailSettings:SenderName"];
            var username = _configuration["EmailSettings:Username"];
            var password = _configuration["EmailSettings:Password"];

            // Fallback to Mock if SMTP details aren't provided
            if (string.IsNullOrEmpty(smptServer) || smptServer == "smtp.gmail.com" && string.IsNullOrEmpty(password) || password == "your-app-password")
            {
                _logger.LogWarning("Real SMTP credentials are not configured. USING MOCK EMAIL LOGGER.");
                _logger.LogInformation("\n========== MOCK EMAIL ==========\nTO: {to}\nSUBJECT: {subject}\nBODY: {body}\n================================\n", 
                    to, subject, body);
                return;
            }

            int smtpPort = int.TryParse(smtpPortString, out var port) ? port : 587;

            using var client = new SmtpClient(smptServer, smtpPort)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail!, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            
            mailMessage.To.Add(to);
            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Email successfully sent to {to}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed to send email to {to}: {exception}", to, ex.Message);
            throw; // optionally rethrow depending on whether registration should fail if email fails
        }
    }

    public async Task SendEmailWithAttachmentAsync(string to, string subject, string body, string attachmentName, byte[] attachmentBytes)
    {
        try
        {
            var smptServer = _configuration["EmailSettings:SmtpServer"];
            var smtpPortString = _configuration["EmailSettings:SmtpPort"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderName = _configuration["EmailSettings:SenderName"];
            var username = _configuration["EmailSettings:Username"];
            var password = _configuration["EmailSettings:Password"];

            // Fallback to Mock if SMTP details aren't provided
            if (string.IsNullOrEmpty(smptServer) || smptServer == "smtp.gmail.com" && string.IsNullOrEmpty(password) || password == "your-app-password")
            {
                _logger.LogWarning("Real SMTP credentials are not configured. USING MOCK EMAIL LOGGER.");
                _logger.LogInformation("\n========== MOCK EMAIL WITH ATTACHMENT ==========\nTO: {to}\nSUBJECT: {subject}\nBODY: {body}\nATTACHMENT: {attachment}\n================================================\n", 
                    to, subject, body, attachmentName);
                return;
            }

            int smtpPort = int.TryParse(smtpPortString, out var port) ? port : 587;

            using var client = new SmtpClient(smptServer, smtpPort)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail!, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            
            mailMessage.To.Add(to);

            // Add attachment
            using var ms = new MemoryStream(attachmentBytes);
            var attachment = new Attachment(ms, attachmentName, "application/pdf");
            mailMessage.Attachments.Add(attachment);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Email with attachment successfully sent to {to}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed to send email to {to}: {exception}", to, ex.Message);
            throw;
        }
    }
}
