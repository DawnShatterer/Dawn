using Dawn.Core.Common;

namespace Dawn.Core.Entities;

public class Institution : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // Branding
    public string LogoUrl { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = "#0d6efd"; // Bootstrap primary default
    public string SecondaryColor { get; set; } = "#6c757d"; // Bootstrap secondary default
    
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
