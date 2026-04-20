namespace Dawn.Core.DTOs;

public class EnrollmentDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string CourseDescription { get; set; } = string.Empty;
    public string InstructorId { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
    public int Progress { get; set; }
}

public class EnrollmentCreateDto
{
    public int CourseId { get; set; }
}

public class EnrollmentStudentDto
{
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
    public int Progress { get; set; }
}

public class BulkEnrollDto
{
    public int BatchId { get; set; }
    public int CourseId { get; set; }
}
