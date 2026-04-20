using AutoMapper;
using Dawn.Core.Entities;
using Dawn.Core.DTOs;

namespace Dawn.Infrastructure.Mapping;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        // Course mappings
        CreateMap<Course, CourseDto>();
            
        CreateMap<CourseDto, Course>(); // Reverse map handled manually without computing properties
        CreateMap<CourseCreateDto, Course>();

        // Lesson mappings
        CreateMap<Lesson, LessonDto>().ReverseMap();

        // Enrollment mappings
        CreateMap<Enrollment, EnrollmentDto>()
            .ForMember(d => d.CourseTitle, o => o.MapFrom(s => s.Course.Title))
            .ForMember(d => d.CourseDescription, o => o.MapFrom(s => s.Course.Description))
            .ForMember(d => d.InstructorId, o => o.MapFrom(s => s.Course.InstructorId));

        CreateMap<Enrollment, EnrollmentStudentDto>()
            .ForMember(d => d.StudentName, o => o.MapFrom(s => s.Student.FullName))
            .ForMember(d => d.StudentEmail, o => o.MapFrom(s => s.Student.Email));

        // LiveClass mappings
        CreateMap<LiveClass, LiveClassDto>().ReverseMap();
        CreateMap<LiveClassCreateDto, LiveClass>();

        // Quiz mappings
        CreateMap<Quiz, QuizDto>()
            .ForMember(d => d.TotalQuestions, o => o.MapFrom(s => s.Questions.Count));
        
        CreateMap<Quiz, QuizDetailStudentDto>();
        CreateMap<Question, QuestionStudentDto>();
        CreateMap<Option, OptionStudentDto>();
        
        CreateMap<QuizCreateDto, Quiz>();
        CreateMap<QuestionCreateDto, Question>();
        CreateMap<OptionCreateDto, Option>();

        // Discussion mappings
        CreateMap<DiscussionThread, DiscussionThreadDto>()
            .ForMember(d => d.AuthorName, o => o.MapFrom(s => s.Author != null ? s.Author.FullName : "Unknown"))
            .ForMember(d => d.AuthorRole, o => o.MapFrom(s => s.Author != null ? s.Author.Role : ""))
            .ForMember(d => d.ReplyCount, o => o.MapFrom(s => s.Replies.Count));

        CreateMap<DiscussionThread, DiscussionThreadDetailDto>()
            .IncludeBase<DiscussionThread, DiscussionThreadDto>();

        CreateMap<DiscussionReply, DiscussionReplyDto>()
            .ForMember(d => d.AuthorName, o => o.MapFrom(s => s.Author != null ? s.Author.FullName : "Unknown"))
            .ForMember(d => d.AuthorRole, o => o.MapFrom(s => s.Author != null ? s.Author.Role : ""));

        CreateMap<DiscussionThreadCreateDto, DiscussionThread>();
        CreateMap<DiscussionReplyCreateDto, DiscussionReply>();

        // Notification Mappings
        CreateMap<Notification, NotificationDto>();
    }
}