using Microsoft.AspNetCore.Http;

namespace Dawn.Api.Services;

public interface IFileService
{
    Task<string> SaveFileAsync(IFormFile file, string[] allowedExtensions, string subDirectory);
    void DeleteFile(string filePath);
}
