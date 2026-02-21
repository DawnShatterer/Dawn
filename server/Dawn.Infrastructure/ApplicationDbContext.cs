using Dawn.Core.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Dawn.Infrastructure.Data
{
    // We inherit from IdentityDbContext to get User/Role tables automatically
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Add your custom tables here as you build features
        // public DbSet<Course> Courses { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // This is where you will define relationships later 
            // (e.g., Student has many Enrolled Courses)
        }
    }
}