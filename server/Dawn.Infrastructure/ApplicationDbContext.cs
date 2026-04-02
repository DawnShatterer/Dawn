using Dawn.Core.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Dawn.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Course> Courses { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<LiveClass> LiveClasses { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Option> Options { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<DiscussionThread> DiscussionThreads { get; set; }
        public DbSet<DiscussionReply> DiscussionReplies { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<Institution> Institutions { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<PlatformRating> PlatformRatings { get; set; }
        public DbSet<PaymentRecord> PaymentRecords { get; set; }
        public DbSet<PointsTransaction> PointsTransactions { get; set; }
        public DbSet<CourseCoupon> CourseCoupons { get; set; }
        public DbSet<PayoutRequest> PayoutRequests { get; set; }
        public DbSet<CourseReview> CourseReviews { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 1. Course & Assignment Relationship (One-to-Many)
            builder.Entity<Assignment>()
                .HasOne(a => a.Course)
                .WithMany(c => c.Assignments)
                .HasForeignKey(a => a.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // 2. Course & Instructor Relationship
            builder.Entity<Course>()
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(c => c.InstructorId)
                .IsRequired();

            // 3. Enrollment Relationships
            builder.Entity<Enrollment>()
                .HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // 4. Unique constraint: a student can only enroll in a course once
            builder.Entity<Enrollment>()
                .HasIndex(e => new { e.StudentId, e.CourseId })
                .IsUnique();

            // 5. Course & Lesson Relationship
            builder.Entity<Lesson>()
                .HasOne(l => l.Course)
                .WithMany(c => c.Lessons)
                .HasForeignKey(l => l.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // 6. Course & LiveClass Relationship
            builder.Entity<LiveClass>()
                .HasOne(l => l.Course)
                .WithMany(c => c.LiveClasses)
                .HasForeignKey(l => l.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // 7. Quiz Relationships
            builder.Entity<Quiz>()
                .HasOne(q => q.Course)
                .WithMany(c => c.Quizzes)
                .HasForeignKey(q => q.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Question>()
                .HasOne(q => q.Quiz)
                .WithMany(qz => qz.Questions)
                .HasForeignKey(q => q.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            // CourseReview Relationship (Prevent cycles)
            builder.Entity<CourseReview>()
                .HasOne(cr => cr.Student)
                .WithMany()
                .HasForeignKey(cr => cr.StudentId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Option>()
                .HasOne(o => o.Question)
                .WithMany(q => q.Options)
                .HasForeignKey(o => o.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Submission>()
                .HasOne(s => s.Student)
                .WithMany()
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent ASP.NET user deletion cascade path issues

            builder.Entity<Submission>()
                .HasOne(s => s.Quiz)
                .WithMany(q => q.Submissions)
                .HasForeignKey(s => s.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            // 8. Discussion Relationships
            builder.Entity<DiscussionThread>()
                .HasOne(d => d.Course)
                .WithMany()
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<DiscussionThread>()
                .HasOne(d => d.Author)
                .WithMany()
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<DiscussionReply>()
                .HasOne(r => r.Thread)
                .WithMany(t => t.Replies)
                .HasForeignKey(r => r.ThreadId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<DiscussionReply>()
                .HasOne(r => r.Author)
                .WithMany()
                .HasForeignKey(r => r.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // 9. Notifications
            builder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 10. Certificates
            builder.Entity<Certificate>()
                .HasOne(c => c.Student)
                .WithMany()
                .HasForeignKey(c => c.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Certificate>()
                .HasOne(c => c.Course)
                .WithMany()
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // 11. Institutions Multi-Tenancy
            builder.Entity<ApplicationUser>()
                .HasOne(u => u.Institution)
                .WithMany(i => i.Users)
                .HasForeignKey(u => u.InstitutionId)
                .OnDelete(DeleteBehavior.SetNull);

            // 12. Table Names
            builder.Entity<Course>().ToTable("Courses");
            builder.Entity<Assignment>().ToTable("Assignments");
            builder.Entity<Enrollment>().ToTable("Enrollments");
            builder.Entity<Lesson>().ToTable("Lessons");
            builder.Entity<LiveClass>().ToTable("LiveClasses");

            // 7. Decimal precision
            builder.Entity<Course>().Property(c => c.Price).HasColumnType("decimal(18,2)");

            // 13. Direct Messages
            builder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.NoAction);

            // 14. Course Announcements
            builder.Entity<Announcement>()
                .HasOne(a => a.Course)
                .WithMany(c => c.Announcements)
                .HasForeignKey(a => a.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Announcement>()
                .HasOne(a => a.Author)
                .WithMany()
                .HasForeignKey(a => a.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // 15. Payment Records
            builder.Entity<PaymentRecord>()
                .HasOne(p => p.Student)
                .WithMany()
                .HasForeignKey(p => p.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PaymentRecord>()
                .HasOne(p => p.Course)
                .WithMany()
                .HasForeignKey(p => p.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PaymentRecord>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<PaymentRecord>().ToTable("PaymentRecords");

            // 16. Dawn Points Ledger
            builder.Entity<PointsTransaction>()
                .HasOne(pt => pt.User)
                .WithMany()
                .HasForeignKey(pt => pt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PointsTransaction>().ToTable("PointsTransactions");

            // 17. Course Coupons
            builder.Entity<CourseCoupon>()
                .HasOne(c => c.Owner)
                .WithMany()
                .HasForeignKey(c => c.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<CourseCoupon>()
                .HasOne(c => c.UsedOnCourse)
                .WithMany()
                .HasForeignKey(c => c.UsedOnCourseId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<CourseCoupon>()
                .Property(c => c.MaxDiscountAmount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<CourseCoupon>()
                .HasIndex(c => c.Code)
                .IsUnique();

            builder.Entity<CourseCoupon>().ToTable("CourseCoupons");

            // 18. Payout Requests
            builder.Entity<PayoutRequest>()
                .HasOne(pr => pr.Instructor)
                .WithMany()
                .HasForeignKey(pr => pr.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PayoutRequest>()
                .Property(pr => pr.Amount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<PayoutRequest>().ToTable("PayoutRequests");
        }
    }
}