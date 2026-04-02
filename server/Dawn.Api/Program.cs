using System.Text;
using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Dawn.Core.Interfaces;
using Dawn.Infrastructure.Repositories;
using Dawn.Infrastructure.Services;
using Microsoft.IdentityModel.Tokens;
using Dawn.Infrastructure.Mapping;
using Dawn.Api.Services;
using Dawn.Api.Data;
using Dawn.Api.Hubs;

try
{
    var builder = WebApplication.CreateBuilder(args);
    // --- 1. SERVICES CONFIGURATION ---
    builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfiles>());
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddHttpClient();

    // Swagger Configuration with JWT Support
    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
        });
        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme { Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
                new string[] {}
            }
        });
    });

    // Database Connection
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connectionString));

    // ASP.NET Core Identity Setup
    builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
        options.User.RequireUniqueEmail = true;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

    // Register Generic Repository & Custom Services
    builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
    builder.Services.AddScoped<IFileService, FileService>();
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();

    // Native C# AI/ML Services 
    builder.Services.AddSingleton<IProfanityFilterService, ProfanityFilterService>();
    builder.Services.AddSingleton<INativeSearchService, NativeSearchService>();

    // SignalR for real-time chat
    builder.Services.AddSignalR();

    // JWT Authentication Setup
    var jwtSettings = builder.Configuration.GetSection("Jwt");
    var keyString = jwtSettings["Key"] ?? "A_Very_Long_And_Secret_Key_For_Dawn_Project_2026_Secure";
    var key = Encoding.ASCII.GetBytes(keyString);

    builder.Services.AddAuthentication(options => {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options => {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = jwtSettings["Issuer"] ?? "DawnApi",
            ValidAudience = jwtSettings["Audience"] ?? "DawnUsers",
            ClockSkew = TimeSpan.Zero
        };

        // Allow SignalR to read JWT from query string (WebSockets can't send headers)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

    // --- 2. HTTP PIPELINE CONFIGURATION ---
    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();
    app.UseStaticFiles();

    app.UseCors(x => x
        .SetIsOriginAllowed(_ => true)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHub<ChatHub>("/chathub");

    // Run Entity Framework Migrations & Custom DbSeeder before standard startup
    using (var scope = app.Services.CreateScope())
    {
        try 
        { 
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.MigrateAsync();
            await DbSeeder.SeedRolesAndUsersAsync(scope.ServiceProvider); 
        }
        catch 
        { 
            // Expected to fail during active EF Database Migrations 
            Console.WriteLine("NOTICE: DbSeeder aborted (This is normal during EF Migrations).");
        }
    }

    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("CRITICAL EXCEPTION DURING STARTUP:");
    Console.WriteLine(ex.ToString());
    throw;
}