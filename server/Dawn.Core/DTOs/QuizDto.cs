namespace Dawn.Core.DTOs;

public class QuizDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int CourseId { get; set; }
    
    // Total questions might be needed
    public int TotalQuestions { get; set; }
}

public class QuizDetailStudentDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<QuestionStudentDto> Questions { get; set; } = new();
}

public class QuestionStudentDto
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Points { get; set; }
    public List<OptionStudentDto> Options { get; set; } = new();
}

public class OptionStudentDto
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    // VERY IMPORTANT: Do NOT send IsCorrect to the student!
}

// Submissions
public class QuizSubmitDto
{
    public int QuizId { get; set; }
    // Dictionary of QuestionId -> SelectedOptionId
    public Dictionary<int, int> Answers { get; set; } = new();
}

public class SubmissionDto
{
    public int Id { get; set; }
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public decimal Percentage { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Creation DTOs for Teachers
public class QuizCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public List<QuestionCreateDto> Questions { get; set; } = new();
}

public class QuestionCreateDto
{
    public string Text { get; set; } = string.Empty;
    public int Points { get; set; } = 1;
    public List<OptionCreateDto> Options { get; set; } = new();
}

public class OptionCreateDto
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}
