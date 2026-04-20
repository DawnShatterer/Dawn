using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Batch : BaseEntity
{
    public string Name { get; set; } = string.Empty; // e.g. Batch 32 BSc CS
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime ExpectedGraduationDate { get; set; }

    // Navigation property for students in this batch
    public ICollection<ApplicationUser> Students { get; set; } = new List<ApplicationUser>();
}

