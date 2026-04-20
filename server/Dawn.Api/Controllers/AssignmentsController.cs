using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Dawn.Infrastructure.Data;
using Dawn.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssignmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IFileService _fileService;

    public AssignmentsController(ApplicationDbContext context, IFileService fileService)
    {
        _context = context;
        _fileService = fileService;
    }

    /// <summary>
    /// Gets all assignments for a given course. If the user is a student, maps their existing submission.
    /// </summary>
    [HttpGet("course/{courseId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourseAssignments(int courseId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var assignments = await _context.Assignments
            .Where(a => a.CourseId == courseId)
            .OrderBy(a => a.DueDate)
            .Select(a => new AssignmentDetailDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                DueDate = a.DueDate,
                HasSubmitted = userId != null && _context.AssignmentSubmissions.Any(s => s.AssignmentId == a.Id && s.StudentId == userId),
                SubmissionGrade = userId != null ? _context.AssignmentSubmissions.Where(s => s.AssignmentId == a.Id && s.StudentId == userId).Select(s => s.Grade).FirstOrDefault() : null,
                SubmissionFileUrl = userId != null ? _context.AssignmentSubmissions.Where(s => s.AssignmentId == a.Id && s.StudentId == userId).Select(s => s.FileUrl).FirstOrDefault() : null
            })
            .ToListAsync();

        return Ok(assignments);
    }

    /// <summary>
    /// Teacher/Admin creates an assignment for their course.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CreateAssignment([FromBody] AssignmentCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var course = await _context.Courses.FindAsync(dto.CourseId);
        if (course == null) return NotFound("Course not found.");

        if (course.InstructorId != userId && userRole?.ToLower() != "admin")
            return Forbid();

        var assignment = new Assignment
        {
            CourseId = dto.CourseId,
            Title = dto.Title,
            Content = dto.Content,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();
        
        return Ok(new { Message = "Assignment created successfully.", Id = assignment.Id });
    }

    /// <summary>
    /// Teacher/Admin deletes an assignment.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> DeleteAssignment(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var assignment = await _context.Assignments
            .Include(a => a.Course)
            .Include(a => a.Submissions) // We mapped SetNull or Restrict, but honestly, cascade deletion in manual logic avoids issues
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null) return NotFound();

        if (assignment.Course.InstructorId != userId && userRole?.ToLower() != "admin")
            return Forbid();

        // Delete all physical files for submissions
        foreach(var sub in assignment.Submissions)
        {
            if(!string.IsNullOrEmpty(sub.FileUrl))
            {
                _fileService.DeleteFile(sub.FileUrl);
            }
        }
        
        // Remove submissions manually before removing assignment to bypass restrict constraint
        _context.AssignmentSubmissions.RemoveRange(assignment.Submissions);
        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Assignment deleted." });
    }

    /// <summary>
    /// Students submit work for an assignment. 
    /// Constraints: PDF/ZIP only, < 100MB.
    /// </summary>
    [HttpPost("submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SubmitAssignment([FromForm] SubmissionRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // 1. Verify existence and enrollment
        var assignment = await _context.Assignments.FindAsync(dto.AssignmentId);
        if (assignment == null) return NotFound("Assignment not found.");

        var isEnrolled = await _context.Enrollments
            .AnyAsync(e => e.StudentId == userId && e.CourseId == assignment.CourseId);
        if (!isEnrolled) return Forbid("You must be enrolled in the course to submit an assignment.");

        // 2. Validate file
        if (dto.File == null || dto.File.Length == 0) return BadRequest("Please upload a file.");
        
        // 100MB Limit check (redundant but safe)
        if (dto.File.Length > 100 * 1024 * 1024) return BadRequest("File size exceeds 100MB limit.");

        var allowedExtensions = new[] { ".pdf", ".zip" };
        string fileUrl;
        try
        {
            fileUrl = await _fileService.SaveFileAsync(dto.File, allowedExtensions, "submissions");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }

        // 3. Save submission record
        var submission = new AssignmentSubmission
        {
            AssignmentId = dto.AssignmentId,
            StudentId = userId,
            FileUrl = fileUrl,
            SubmittedAt = DateTime.UtcNow
        };

        _context.AssignmentSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Assignment submitted successfully!", FileUrl = fileUrl });
    }

    /// <summary>
    /// Instructors can see all submissions for their assignment.
    /// </summary>
    [HttpGet("assignment/{assignmentId}/all")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GetSubmissions(int assignmentId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var assignment = await _context.Assignments
            .Include(a => a.Course)
            .FirstOrDefaultAsync(a => a.Id == assignmentId);

        if (assignment == null) return NotFound();

        // Security check
        if (assignment.Course.InstructorId != userId && userRole?.ToLower() != "admin")
            return Forbid();

        var submissions = await _context.AssignmentSubmissions
            .Include(s => s.Student)
            .Where(s => s.AssignmentId == assignmentId)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new {
                s.Id,
                s.SubmittedAt,
                s.FileUrl,
                s.Grade,
                s.Feedback,
                StudentName = s.Student.FullName,
                StudentEmail = s.Student.Email,
                IsGraded = s.Grade.HasValue
            })
            .ToListAsync();

        return Ok(submissions);
    }

    /// <summary>
    /// Instructor grades a submission.
    /// </summary>
    [HttpPost("grade/{submissionId}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GradeSubmission(int submissionId, [FromBody] GradeSubmissionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var submission = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .ThenInclude(a => a.Course)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null) return NotFound();

        // Security check
        if (submission.Assignment.Course.InstructorId != userId && User.FindFirstValue(ClaimTypes.Role)?.ToLower() != "admin")
            return Forbid();

        submission.Grade = dto.Grade;
        submission.Feedback = dto.Feedback;
        submission.GradedAt = DateTime.UtcNow;
        submission.GradedByInstructorId = userId;

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Grade saved successfully." });
    }
}

public class SubmissionRequestDto
{
    public int AssignmentId { get; set; }
    public IFormFile File { get; set; } = null!;
}

public class GradeSubmissionDto
{
    public int Grade { get; set; } // 0-100
    public string? Feedback { get; set; }
}

public class AssignmentCreateDto
{
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
}

public class AssignmentDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public bool HasSubmitted { get; set; }
    public int? SubmissionGrade { get; set; }
    public string? SubmissionFileUrl { get; set; }
}
