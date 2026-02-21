using Dawn.Core.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Dawn.Infrastructure.Data
{
    // Inheriting from IdentityDbContext<ApplicationUser> ensures Identity tables (Users, Roles) 
    // are integrated with our custom e-learning tables.
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Course> Courses { get; set; }
        public DbSet<Assignment> Assignments { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            // Crucial: Base call keeps Identity table configurations intact
            base.OnModelCreating(builder);

            // 1. Course & Assignment Relationship (One-to-Many)
            builder.Entity<Assignment>()
                .HasOne(a => a.Course)
                .WithMany(c => c.Assignments)
                .HasForeignKey(a => a.CourseId)
                .OnDelete(DeleteBehavior.Cascade); // If a course is deleted, its assignments are too

            // 2. Course & Instructor Relationship
            // We link Course.InstructorId to the Identity User table
            builder.Entity<Course>()
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(c => c.InstructorId)
                .IsRequired();

            // 3. Optional: Configure Table Names (Default is plural, but you can force it)
            builder.Entity<Course>().ToTable("Courses");
            builder.Entity<Assignment>().ToTable("Assignments");

            // 4. Set precision for any decimals if you add them later (e.g., Course Prices)
            // Example: builder.Entity<Course>().Property(c => c.Price).HasColumnType("decimal(18,2)");
        }
    }
}