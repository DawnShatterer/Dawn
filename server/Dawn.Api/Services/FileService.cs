namespace Dawn.Api.Services;

public class FileService : IFileService
{
    private readonly IWebHostEnvironment _env;

    public FileService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string[] allowedExtensions, string subDirectory)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
            throw new ArgumentException($"Invalid file extension. Allowed: {string.Join(", ", allowedExtensions)}");

        // Example path: wwwroot/uploads/videos
        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", subDirectory);
        
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        // Generate unique filename via Guid
        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return the relative URL (e.g. /uploads/videos/123-abc_video.mp4)
        return $"/uploads/{subDirectory}/{uniqueFileName}";
    }

    public void DeleteFile(string relativeUrl)
    {
        if (string.IsNullOrEmpty(relativeUrl)) return;

        // Convert the relative URL (e.g., /uploads/videos/file.mp4) into physical path
        var relativePath = relativeUrl.TrimStart('/');
        var physicalPath = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), relativePath.Replace("/", "\\"));

        if (File.Exists(physicalPath))
        {
            File.Delete(physicalPath);
        }
    }
}
