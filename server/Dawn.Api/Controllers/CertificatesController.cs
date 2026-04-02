using Dawn.Api.Services;
using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CertificatesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IFileService _fileService;

    public CertificatesController(ApplicationDbContext context, IFileService fileService)
    {
        _context = context;
        _fileService = fileService;
    }

    /// <summary>
    /// Upload a certificate (Student only). Accepts file + title via multipart/form-data.
    /// </summary>
    [HttpPost("upload")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> UploadCertificate([FromForm] string title, [FromForm] IFormFile file)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        if (file == null || file.Length == 0) return BadRequest("Please select a file to upload.");

        string fileUrl;
        try
        {
            fileUrl = await _fileService.SaveFileAsync(file, new[] { ".pdf", ".jpg", ".jpeg", ".png", ".webp" }, "certificates");
        }
        catch (Exception ex)
        {
            return BadRequest($"File upload error: {ex.Message}");
        }

        var cert = new Certificate
        {
            Title = title,
            FileUrl = fileUrl,
            StudentId = userId
        };

        _context.Certificates.Add(cert);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Certificate uploaded successfully!", id = cert.Id });
    }

    /// <summary>
    /// Get all certificates for the currently logged-in student.
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyCertificates()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var certs = await _context.Certificates
            .Where(c => c.StudentId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.FileUrl,
                c.CreatedAt
            })
            .ToListAsync();

        return Ok(certs);
    }

    /// <summary>
    /// Get all certificates for a specific student (Admin/Teacher only).
    /// </summary>
    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GetStudentCertificates(string studentId)
    {
        var certs = await _context.Certificates
            .Where(c => c.StudentId == studentId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.FileUrl,
                c.CreatedAt
            })
            .ToListAsync();

        return Ok(certs);
    }

    /// <summary>
    /// Delete a certificate (student can delete their own).
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCertificate(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var cert = await _context.Certificates.FindAsync(id);
        if (cert == null) return NotFound();

        if (cert.StudentId != userId && userRole != "Admin")
            return Forbid();

        if (!string.IsNullOrEmpty(cert.FileUrl))
            _fileService.DeleteFile(cert.FileUrl);

        _context.Certificates.Remove(cert);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Certificate deleted." });
    }
}
