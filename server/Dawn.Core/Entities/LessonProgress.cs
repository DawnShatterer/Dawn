using System;
using Dawn.Core.Common;

namespace Dawn.Core.Entities
{
    public class LessonProgress : BaseEntity
    {
        public string StudentId { get; set; } = string.Empty;
        public ApplicationUser Student { get; set; } = null!;

        public int LessonId { get; set; }
        public Lesson Lesson { get; set; } = null!;

        public bool IsCompleted { get; set; } = false;
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    }
}
