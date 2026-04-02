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
public class QuizzesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public QuizzesController(
        ApplicationDbContext context,
        IMapper mapper,
        INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetCourseQuizzes(int courseId)
    {
        var courseQuizzes = await _context.Quizzes
            .Include(q => q.Questions)
            .Where(q => q.CourseId == courseId && q.IsActive)
            .ToListAsync();
        
        return Ok(_mapper.Map<IEnumerable<QuizDto>>(courseQuizzes));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetQuizForStudent(int id)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id);
        
        if (quiz == null) return NotFound("Quiz not found");
        if (!quiz.IsActive) return BadRequest("Quiz is no longer active");

        // The DTO maps IsCorrect out inherently via object shape
        var dto = _mapper.Map<QuizDetailStudentDto>(quiz);
        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CreateQuiz([FromBody] QuizCreateDto dto)
    {
        var course = await _context.Courses.FindAsync(dto.CourseId);
        if (course == null) return NotFound("Course not found");

        var quiz = _mapper.Map<Quiz>(dto);
        _context.Quizzes.Add(quiz);
        await _context.SaveChangesAsync();

        // Notify enrolled students
        await _notificationService.NotifyCourseStudentsAsync(
            course.Id, 
            "New Assessment Available", 
            $"A new quiz '{quiz.Title}' has been generated for your course."
        );

        return Ok(new { Message = "Quiz created successfully", QuizId = quiz.Id });
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SubmitQuiz(int id, [FromBody] QuizSubmitDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id);
            
        if (quiz == null) return NotFound("Quiz not found");

        // Calculate score
        int score = 0;
        int totalPoints = 0;

        foreach (var q in quiz.Questions)
        {
            totalPoints += q.Points;
            if (dto.Answers.TryGetValue(q.Id, out int selectedOptionId))
            {
                var option = q.Options.FirstOrDefault(o => o.Id == selectedOptionId);
                if (option != null && option.IsCorrect)
                {
                    score += q.Points;
                }
            }
        }

        var submission = new Submission
        {
            QuizId = id,
            StudentId = userId!,
            Score = score,
            TotalPoints = totalPoints
        };

        _context.Submissions.Add(submission);
        await _context.SaveChangesAsync();

        return Ok(new { 
            Message = "Quiz submitted successfully", 
            Score = score, 
            TotalPoints = totalPoints,
            Percentage = submission.Percentage
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> DeleteQuiz(int id)
    {
        var quiz = await _context.Quizzes.FindAsync(id);
        if (quiz == null) return NotFound("Quiz not found");

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
