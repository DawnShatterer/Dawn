using Microsoft.AspNetCore.Http;

namespace Dawn.Api.DTOs;

public class InstitutionUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public IFormFile? LogoFile { get; set; }
    public string PrimaryColor { get; set; } = string.Empty;
    public string SecondaryColor { get; set; } = string.Empty;
}
