using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Dawn.Core.Entities;

public class StudentSessionLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey("UserId")]
    public ApplicationUser? User { get; set; }

    public DateTime StartTime { get; set; } = DateTime.UtcNow;

    public DateTime? EndTime { get; set; }

    public int? DurationSeconds { get; set; }

    public int? CourseId { get; set; }

    public int? LessonId { get; set; }

    public string? Device { get; set; }

    public string? IpAddress { get; set; }
}
