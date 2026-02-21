using AutoMapper;
using Dawn.Core.Entities;
using Dawn.Core.DTOs;

namespace Dawn.Infrastructure.Mapping;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<Course, CourseDto>().ReverseMap();
        CreateMap<CourseCreateDto, Course>();
    }
}