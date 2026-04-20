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
        public DbSet<Submission> Submissions { get; set; } // Note: Quiz submissions
        public DbSet<AssignmentSubmission> AssignmentSubmissions { get; set; } // Note: Assignments
        public DbSet<DiscussionThread> DiscussionThreads { get; set; }
        public DbSet<DiscussionReply> DiscussionReplies { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Batch> Batches { get; set; }
        public DbSet<SemesterInvoice> SemesterInvoices { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<Institution> Institutions { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<PaymentRecord> PaymentRecords { get; set; }

        public DbSet<StudentSessionLog> StudentSessionLogs { get; set; }
        public DbSet<LessonProgress> LessonProgresses { get; set; }
        public DbSet<CourseAssignmentAudit> CourseAssignmentAudits { get; set; }


        public DbSet<SupportInquiry> SupportInquiries { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 0. Assignment Submissions (PDF/ZIP uploads)
            builder.Entity<AssignmentSubmission>()
                .HasOne(s => s.Assignment)
                .WithMany(a => a.Submissions) // We should add this collection to Assignment.cs too
                .HasForeignKey(s => s.AssignmentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<AssignmentSubmission>()
                .HasOne(s => s.Student)
                .WithMany()
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<AssignmentSubmission>().ToTable("AssignmentSubmissions");

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

            // 7. (Removed)

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
                .HasOne(p => p.SemesterInvoice)
                .WithMany()
                .HasForeignKey(p => p.SemesterInvoiceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<PaymentRecord>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");

            builder.Entity<PaymentRecord>().ToTable("PaymentRecords");



            builder.Entity<StudentSessionLog>().ToTable("StudentSessionLogs");

            // 20. Lesson Progress tracking
            builder.Entity<LessonProgress>()
                .HasOne(lp => lp.Student)
                .WithMany()
                .HasForeignKey(lp => lp.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<LessonProgress>()
                .HasOne(lp => lp.Lesson)
                .WithMany()
                .HasForeignKey(lp => lp.LessonId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<LessonProgress>()
                .HasIndex(lp => new { lp.StudentId, lp.LessonId })
                .IsUnique();

            builder.Entity<LessonProgress>().ToTable("LessonProgresses");

            // 21. Batches
            builder.Entity<ApplicationUser>()
                .HasOne(u => u.Batch)
                .WithMany(c => c.Students)
                .HasForeignKey(u => u.BatchId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.Entity<Batch>().ToTable("Batches");

            // 22. Semester Invoices
            builder.Entity<SemesterInvoice>()
                .HasOne(si => si.Student)
                .WithMany()
                .HasForeignKey(si => si.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SemesterInvoice>()
                .Property(si => si.AmountNpr)
                .HasColumnType("decimal(18,2)");
            builder.Entity<SemesterInvoice>().ToTable("SemesterInvoices");

            // 23. Attendance Records
            builder.Entity<AttendanceRecord>()
                .HasOne(ar => ar.Student)
                .WithMany()
                .HasForeignKey(ar => ar.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<AttendanceRecord>()
                .HasOne(ar => ar.Module)
                .WithMany()
                .HasForeignKey(ar => ar.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.Entity<AttendanceRecord>().ToTable("AttendanceRecords");

            // 24. Course Assignment Audit Trail
            builder.Entity<CourseAssignmentAudit>()
                .HasOne(a => a.Course)
                .WithMany()
                .HasForeignKey(a => a.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
            
            builder.Entity<CourseAssignmentAudit>()
                .HasOne(a => a.NewTeacher)
                .WithMany()
                .HasForeignKey(a => a.NewTeacherId)
                .OnDelete(DeleteBehavior.Restrict);
            
            builder.Entity<CourseAssignmentAudit>()
                .HasOne(a => a.AdminUser)
                .WithMany()
                .HasForeignKey(a => a.AdminUserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            builder.Entity<CourseAssignmentAudit>()
                .HasIndex(a => a.CourseId);
            
            builder.Entity<CourseAssignmentAudit>()
                .HasIndex(a => a.AssignedAt);
            
            builder.Entity<CourseAssignmentAudit>().ToTable("CourseAssignmentAudits");

        }
    }
}
