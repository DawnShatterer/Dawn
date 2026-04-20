using Dawn.Core.DTOs;
using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Dawn.Api.Services;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Dawn.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class InstitutionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IFileService _fileService;
    private readonly ICacheService _cacheService;
    private const string BrandingCacheKey = "global_branding";

    public InstitutionsController(ApplicationDbContext context, IFileService fileService, ICacheService cacheService)
    {
        _context = context;
        _fileService = fileService;
        _cacheService = cacheService;
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<ActionResult<InstitutionDto>> GetPublicBranding()
    {
        // Try to get from cache first
        var cachedBranding = await _cacheService.GetAsync<InstitutionDto>(BrandingCacheKey);
        if (cachedBranding != null) return Ok(cachedBranding);

        var institution = await _context.Institutions.OrderBy(i => i.Id).FirstOrDefaultAsync();

        InstitutionDto dto;
        if (institution == null)
        {
            dto = new InstitutionDto 
            {
                Id = 0,
                Name = "Dawn Platform",
                LogoUrl = "/logo.png",
                PrimaryColor = "#0d6efd",
                SecondaryColor = "#6c757d"
            };
        }
        else
        {
            dto = new InstitutionDto
            {
                Id = institution.Id,
                Name = institution.Name,
                Description = institution.Description,
                LogoUrl = institution.LogoUrl,
                PrimaryColor = institution.PrimaryColor,
                SecondaryColor = institution.SecondaryColor
            };
        }

        // Cache for 1 hour
        await _cacheService.SetAsync(BrandingCacheKey, dto, TimeSpan.FromHours(1));
        return Ok(dto);
    }

    [HttpGet("my-branding")]
    public async Task<ActionResult<InstitutionDto>> GetMyBranding()
    {
        return await GetPublicBranding();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<InstitutionDto>> CreateOrUpdateInstitution([FromForm] Dawn.Api.DTOs.InstitutionUpdateDto dto)
    {
        var institution = await _context.Institutions.OrderBy(i => i.Id).FirstOrDefaultAsync();
        
        if (institution == null)
        {
            institution = new Institution();
            _context.Institutions.Add(institution);
        }

        institution.Name = dto.Name;
        institution.Description = dto.Description;
        institution.PrimaryColor = dto.PrimaryColor;
        institution.SecondaryColor = dto.SecondaryColor;

        if (dto.LogoFile != null && dto.LogoFile.Length > 0)
        {
            if (!string.IsNullOrEmpty(institution.LogoUrl) && !institution.LogoUrl.StartsWith("http") && institution.LogoUrl != "/logo.png")
            {
                try { _fileService.DeleteFile(institution.LogoUrl); } catch { /* ignore */ }
            }
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".svg" };
            institution.LogoUrl = await _fileService.SaveFileAsync(dto.LogoFile, allowedExtensions, "branding");
        }
        else if (dto.LogoUrl != null)
        {
            institution.LogoUrl = dto.LogoUrl;
        }

        await _context.SaveChangesAsync();

        // Clear branding cache
        await _cacheService.RemoveAsync(BrandingCacheKey);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var admin = await _context.Users.FindAsync(userId);
        if (admin != null)
        {
            admin.InstitutionId = institution.Id;
            await _context.SaveChangesAsync();
        }

        return Ok(new InstitutionDto
        {
            Id = institution.Id,
            Name = institution.Name,
            Description = institution.Description,
            LogoUrl = institution.LogoUrl,
            PrimaryColor = institution.PrimaryColor,
            SecondaryColor = institution.SecondaryColor
        });
    }
}
