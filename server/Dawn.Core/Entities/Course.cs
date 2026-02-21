using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Course : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string InstructorId { get; set; } = string.Empty; // Links to ApplicationUser
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}