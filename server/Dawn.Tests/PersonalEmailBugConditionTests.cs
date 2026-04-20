using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dawn.Tests;

/// <summary>
/// Bug Condition Exploration Test for PersonalEmail Column Missing from Database
/// 
/// **Validates: Requirements 1.1, 1.2, 1.3**
/// 
/// CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
/// 
/// This test verifies that Entity Framework queries against AspNetUsers table fail
/// with SqlException "Invalid column name 'PersonalEmail'" because the column does
/// not exist in the database schema, even though it exists in the ApplicationUser entity model.
/// 
/// Expected Outcome on UNFIXED database: Test FAILS with SqlException
/// Expected Outcome on FIXED database: Test PASSES (queries execute successfully)
/// </summary>
public class PersonalEmailBugConditionTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public PersonalEmailBugConditionTests()
    {
        // Use the same connection string as the application
        var connectionString = "Server=LAPTOP-BK9CSTS5\\SQLEXPRESS;Database=DawnDb;Trusted_Connection=True;TrustServerCertificate=True;";
        
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        _context = new ApplicationDbContext(options);

        // Setup UserManager for testing login scenarios
        var userStore = new Microsoft.AspNetCore.Identity.EntityFrameworkCore.UserStore<ApplicationUser>(_context);
        _userManager = new UserManager<ApplicationUser>(
            userStore,
            null!, // IOptions<IdentityOptions>
            new PasswordHasher<ApplicationUser>(),
            null!, // IEnumerable<IUserValidator<ApplicationUser>>
            null!, // IEnumerable<IPasswordValidator<ApplicationUser>>
            null!, // ILookupNormalizer
            null!, // IdentityErrorDescriber
            null!, // IServiceProvider
            null!  // ILogger<UserManager<ApplicationUser>>
        );
    }

    /// <summary>
    /// Property 1: Bug Condition - PersonalEmail Column Missing from Database
    /// 
    /// Test that Entity Framework queries against AspNetUsers table fail with SqlException
    /// "Invalid column name 'PersonalEmail'" when the column does not exist in the database.
    /// 
    /// This test attempts multiple query scenarios that would trigger the bug:
    /// 1. Login attempt (UserManager.FindByEmailAsync)
    /// 2. User profile query (direct DbContext query)
    /// 3. User list query (querying all users)
    /// 
    /// On UNFIXED database: This test will FAIL because queries crash with SqlException
    /// On FIXED database: This test will PASS because PersonalEmail column exists
    /// </summary>
    [Fact]
    public async Task BugCondition_QueriesFailWithPersonalEmailColumnMissing()
    {
        // First, verify the database schema state
        var columnExists = await CheckPersonalEmailColumnExists();
        
        // Document the schema state for debugging
        var schemaMessage = columnExists 
            ? "PersonalEmail column EXISTS in database (FIXED state)" 
            : "PersonalEmail column MISSING from database (UNFIXED state - BUG CONDITION)";
        
        // Act: Attempt queries that would trigger the bug
        
        // Test Case 1: User list query - Query all users
        // This is the simplest query that will fail on unfixed database
        Exception? listQueryException = null;
        try
        {
            var users = await _context.Users.Take(1).ToListAsync();
        }
        catch (Exception ex)
        {
            listQueryException = ex;
        }

        // Test Case 2: Login attempt - UserManager.FindByEmailAsync
        // This is the primary bug scenario from the requirements
        Exception? loginQueryException = null;
        try
        {
            var user = await _userManager.FindByEmailAsync("test@example.com");
        }
        catch (Exception ex)
        {
            loginQueryException = ex;
        }

        // Test Case 3: User profile query - Direct DbContext query
        Exception? profileQueryException = null;
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "test@example.com");
        }
        catch (Exception ex)
        {
            profileQueryException = ex;
        }

        // Assert: Verify behavior matches database schema state
        
        if (!columnExists)
        {
            // UNFIXED DATABASE: Expect SqlException with PersonalEmail error
            // This assertion will FAIL the test, which is CORRECT - it proves the bug exists
            
            Assert.NotNull(listQueryException);
            var sqlEx = Assert.IsType<SqlException>(listQueryException);
            Assert.Contains("PersonalEmail", sqlEx.Message);
            Assert.Contains("Invalid column name", sqlEx.Message);
            
            // Additional verification for other query types
            Assert.NotNull(loginQueryException);
            Assert.NotNull(profileQueryException);
            
            // If we reach here, the bug condition is confirmed
            throw new Exception($"BUG CONDITION CONFIRMED: {schemaMessage}. " +
                              $"All queries fail with SqlException: {sqlEx.Message}");
        }
        else
        {
            // FIXED DATABASE: Queries should succeed without exceptions
            Assert.Null(listQueryException);
            Assert.Null(loginQueryException);
            Assert.Null(profileQueryException);
        }
    }

    /// <summary>
    /// Verify database schema inspection shows PersonalEmail column status in AspNetUsers table
    /// </summary>
    [Fact]
    public async Task BugCondition_DatabaseSchemaInspection_PersonalEmailColumnStatus()
    {
        // Act: Check if PersonalEmail column exists in database schema
        var columnExists = await CheckPersonalEmailColumnExists();

        // Assert: Document the current state
        // On UNFIXED database: columnExists should be FALSE (bug condition)
        // On FIXED database: columnExists should be TRUE (expected behavior)
        
        if (!columnExists)
        {
            // UNFIXED DATABASE: Column does not exist - this is the bug condition
            // This assertion will FAIL the test, which is CORRECT - it proves the bug exists
            Assert.True(columnExists, 
                "BUG CONDITION CONFIRMED: PersonalEmail column does NOT exist in AspNetUsers table. " +
                "This causes all Entity Framework queries to fail with SqlException.");
        }
        else
        {
            // FIXED DATABASE: Column exists - bug is fixed
            Assert.True(columnExists, 
                "PersonalEmail column EXISTS in AspNetUsers table (EXPECTED BEHAVIOR)");
        }
    }

    /// <summary>
    /// Helper method to check if PersonalEmail column exists in AspNetUsers table
    /// </summary>
    private async Task<bool> CheckPersonalEmailColumnExists()
    {
        var query = @"
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'AspNetUsers' 
            AND COLUMN_NAME = 'PersonalEmail'";

        using var connection = new SqlConnection("Server=LAPTOP-BK9CSTS5\\SQLEXPRESS;Database=DawnDb;Trusted_Connection=True;TrustServerCertificate=True;");
        await connection.OpenAsync();
        
        using var command = new SqlCommand(query, connection);
        var count = (int)await command.ExecuteScalarAsync()!;
        
        return count > 0;
    }

    public void Dispose()
    {
        _userManager?.Dispose();
        _context?.Dispose();
    }
}
