using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Quiz : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Relationships
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;
    
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}

public class Question : BaseEntity
{
    public string Text { get; set; } = string.Empty;
    public int Points { get; set; } = 1;

    // Relationships
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;

    public ICollection<Option> Options { get; set; } = new List<Option>();
}

public class Option : BaseEntity
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; } = false;

    // Relationships
    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;
}

public class Submission : BaseEntity
{
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public decimal Percentage => TotalPoints > 0 ? ((decimal)Score / TotalPoints) * 100 : 0;

    // Relationships
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;

    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser Student { get; set; } = null!;
}
