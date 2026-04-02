using Dawn.Core.DTOs;
using Dawn.Core.Entities;
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

    public InstitutionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("my-branding")]
    public async Task<ActionResult<InstitutionDto>> GetMyBranding()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var user = await _context.Users
            .Include(u => u.Institution)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.Institution == null)
        {
            // Return default dawn branding fallback
            return Ok(new InstitutionDto 
            {
                Id = 0,
                Name = "Dawn Platform",
                LogoUrl = "/logo.png",
                PrimaryColor = "#0d6efd", // Bootstrap primary
                SecondaryColor = "#6c757d"
            });
        }

        return Ok(new InstitutionDto
        {
            Id = user.Institution.Id,
            Name = user.Institution.Name,
            Description = user.Institution.Description,
            LogoUrl = user.Institution.LogoUrl,
            PrimaryColor = user.Institution.PrimaryColor,
            SecondaryColor = user.Institution.SecondaryColor
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<InstitutionDto>> CreateInstitution([FromBody] InstitutionDto dto)
    {
        var institution = new Institution
        {
            Name = dto.Name,
            Description = dto.Description,
            LogoUrl = dto.LogoUrl,
            PrimaryColor = dto.PrimaryColor,
            SecondaryColor = dto.SecondaryColor
        };

        _context.Institutions.Add(institution);
        await _context.SaveChangesAsync();
        
        dto.Id = institution.Id;
        return CreatedAtAction(nameof(GetMyBranding), new { id = dto.Id }, dto);
    }
}
