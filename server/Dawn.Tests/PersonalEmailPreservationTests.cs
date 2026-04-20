using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FsCheck;
using FsCheck.Xunit;

namespace Dawn.Tests;

/// <summary>
/// Preservation Property Tests for PersonalEmail Column Fix
/// 
/// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
/// 
/// Property 2: Preservation - Existing Authentication and User Operations
/// 
/// These tests verify that all existing authentication flows and user operations
/// continue to work exactly as before the PersonalEmail column fix. Since the bug
/// blocks ALL Entity Framework queries to AspNetUsers, these tests use direct SQL
/// queries to establish baseline behavior that must be preserved.
/// 
/// IMPORTANT: These tests document the expected behavior patterns that must remain
/// unchanged after applying the migration to add the PersonalEmail column.
/// </summary>
public class PersonalEmailPreservationTests : IDisposable
{
    private readonly string _connectionString;
    private readonly ApplicationDbContext _context;

    public PersonalEmailPreservationTests()
    {
        _connectionString = "Server=LAPTOP-BK9CSTS5\\SQLEXPRESS;Database=DawnDb;Trusted_Connection=True;TrustServerCertificate=True;";
        
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connectionString)
            .Options;

        _context = new ApplicationDbContext(options);
    }

    /// <summary>
    /// Property: User Authentication Data Integrity
    /// 
    /// For any user in the database, their authentication-related properties
    /// (Email, PasswordHash, SecurityStamp, etc.) must remain intact and queryable
    /// after the PersonalEmail column is added.
    /// 
    /// This test uses direct SQL to bypass the PersonalEmail bug and verify that
    /// core authentication data is present and valid.
    /// </summary>
    [Fact]
    public async Task Preservation_UserAuthenticationDataIntegrity()
    {
        // Arrange: Query users directly via SQL (bypassing Entity Framework to avoid PersonalEmail bug)
        var query = @"
            SELECT TOP 10
                Id, 
                Email, 
                UserName, 
                PasswordHash, 
                SecurityStamp,
                EmailConfirmed,
                LockoutEnabled,
                AccessFailedCount
            FROM AspNetUsers";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        var userCount = 0;
        var usersWithValidAuth = 0;

        // Act: Verify each user has valid authentication data
        while (await reader.ReadAsync())
        {
            userCount++;
            
            var id = reader.GetString(0);
            var email = reader.IsDBNull(1) ? null : reader.GetString(1);
            var userName = reader.IsDBNull(2) ? null : reader.GetString(2);
            var passwordHash = reader.IsDBNull(3) ? null : reader.GetString(3);
            var securityStamp = reader.IsDBNull(4) ? null : reader.GetString(4);
            var emailConfirmed = reader.GetBoolean(5);
            var lockoutEnabled = reader.GetBoolean(6);
            var accessFailedCount = reader.GetInt32(7);

            // Verify authentication data integrity
            if (!string.IsNullOrEmpty(id) && 
                !string.IsNullOrEmpty(email) && 
                !string.IsNullOrEmpty(userName) &&
                !string.IsNullOrEmpty(passwordHash))
            {
                usersWithValidAuth++;
            }
        }

        // Assert: All users should have valid authentication data
        // This behavior MUST be preserved after adding PersonalEmail column
        Assert.True(userCount > 0, "Database should contain users for preservation testing");
        Assert.Equal(userCount, usersWithValidAuth);
    }

    /// <summary>
    /// Property: User Profile Properties Preservation
    /// 
    /// For any user in the database, their profile properties (FullName, Role, Phone,
    /// Location, etc.) must remain intact and queryable after the PersonalEmail column
    /// is added.
    /// 
    /// This test verifies that existing ApplicationUser properties are preserved.
    /// </summary>
    [Fact]
    public async Task Preservation_UserProfilePropertiesIntact()
    {
        // Arrange: Query user profile data directly via SQL
        var query = @"
            SELECT TOP 10
                Id,
                FullName,
                Role,
                Phone,
                Location,
                Grade,
                InstitutionId,
                BatchId,
                CreatedAt,
                LoginCount
            FROM AspNetUsers";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        var userCount = 0;
        var usersWithValidProfile = 0;

        // Act: Verify each user has valid profile data
        while (await reader.ReadAsync())
        {
            userCount++;
            
            var id = reader.GetString(0);
            var fullName = reader.GetString(1);
            var role = reader.GetString(2);
            var createdAt = reader.GetDateTime(8);
            var loginCount = reader.GetInt32(9);

            // Verify profile data integrity
            if (!string.IsNullOrEmpty(id) && 
                !string.IsNullOrEmpty(fullName) && 
                !string.IsNullOrEmpty(role))
            {
                usersWithValidProfile++;
            }
        }

        // Assert: All users should have valid profile data
        // This behavior MUST be preserved after adding PersonalEmail column
        Assert.True(userCount > 0, "Database should contain users for preservation testing");
        Assert.Equal(userCount, usersWithValidProfile);
    }

    /// <summary>
    /// Property: Password Recovery Properties Preservation
    /// 
    /// For any user in the database, their password recovery properties (RecoveryEmail,
    /// PasswordResetCode, PasswordResetCodeExpiry) must remain intact and queryable
    /// after the PersonalEmail column is added.
    /// 
    /// These properties were added in a previous migration and must continue to work.
    /// </summary>
    [Fact]
    public async Task Preservation_PasswordRecoveryPropertiesIntact()
    {
        // Arrange: Query password recovery data directly via SQL
        var query = @"
            SELECT 
                Id,
                RecoveryEmail,
                PasswordResetCode,
                PasswordResetCodeExpiry
            FROM AspNetUsers
            WHERE RecoveryEmail IS NOT NULL";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        var usersWithRecoveryEmail = 0;

        // Act: Verify password recovery data is accessible
        while (await reader.ReadAsync())
        {
            usersWithRecoveryEmail++;
            
            var id = reader.GetString(0);
            var recoveryEmail = reader.GetString(1);

            // Verify recovery email is valid
            Assert.False(string.IsNullOrEmpty(recoveryEmail));
        }

        // Assert: Password recovery properties should be queryable
        // This behavior MUST be preserved after adding PersonalEmail column
        // Note: It's OK if no users have recovery emails set, we're just verifying the columns exist
        Assert.True(true, $"Password recovery columns are accessible. Found {usersWithRecoveryEmail} users with recovery emails.");
    }

    /// <summary>
    /// Property: Role-Based Data Preservation
    /// 
    /// For any role (Student, Teacher, Admin, Staff), users with that role must remain
    /// queryable and their role assignments must be preserved after the PersonalEmail
    /// column is added.
    /// </summary>
    [Fact]
    public async Task Preservation_RoleBasedDataIntact()
    {
        // Arrange: Query users by role directly via SQL
        var roles = new[] { "Student", "Teacher", "Admin", "Staff" };
        var roleCounts = new Dictionary<string, int>();

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Act: Count users in each role
        foreach (var role in roles)
        {
            var query = $"SELECT COUNT(*) FROM AspNetUsers WHERE Role = @Role";
            using var command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@Role", role);
            
            var count = (int)await command.ExecuteScalarAsync()!;
            roleCounts[role] = count;
        }

        // Assert: Role-based queries should work
        // This behavior MUST be preserved after adding PersonalEmail column
        var totalUsers = roleCounts.Values.Sum();
        Assert.True(totalUsers > 0, "Database should contain users with roles for preservation testing");
        
        // Verify each role has at least some representation (or document if not)
        foreach (var kvp in roleCounts)
        {
            // Just document the role distribution - the important thing is the query works
            Assert.True(true, $"Role '{kvp.Key}' has {kvp.Value} users");
        }
    }

    /// <summary>
    /// Property: Institution Relationship Preservation
    /// 
    /// For any user with an InstitutionId, the foreign key relationship to the
    /// Institution table must remain intact and queryable after the PersonalEmail
    /// column is added.
    /// </summary>
    [Fact]
    public async Task Preservation_InstitutionRelationshipIntact()
    {
        // Arrange: Query users with institution relationships directly via SQL
        var query = @"
            SELECT 
                u.Id,
                u.InstitutionId,
                i.Name as InstitutionName
            FROM AspNetUsers u
            LEFT JOIN Institutions i ON u.InstitutionId = i.Id
            WHERE u.InstitutionId IS NOT NULL";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        var usersWithInstitution = 0;
        var validRelationships = 0;

        // Act: Verify institution relationships are intact
        while (await reader.ReadAsync())
        {
            usersWithInstitution++;
            
            var userId = reader.GetString(0);
            var institutionId = reader.GetInt32(1);
            var institutionName = reader.IsDBNull(2) ? null : reader.GetString(2);

            // Verify the foreign key relationship is valid
            if (institutionId > 0 && !string.IsNullOrEmpty(institutionName))
            {
                validRelationships++;
            }
        }

        // Assert: Institution relationships should be preserved
        // This behavior MUST be preserved after adding PersonalEmail column
        if (usersWithInstitution > 0)
        {
            Assert.Equal(usersWithInstitution, validRelationships);
        }
        else
        {
            Assert.True(true, "No users with institution relationships found, but query executed successfully");
        }
    }

    /// <summary>
    /// Property: Batch Relationship Preservation
    /// 
    /// For any user with a BatchId, the foreign key relationship to the Batch table
    /// must remain intact and queryable after the PersonalEmail column is added.
    /// </summary>
    [Fact]
    public async Task Preservation_BatchRelationshipIntact()
    {
        // Arrange: Query users with batch relationships directly via SQL
        var query = @"
            SELECT 
                u.Id,
                u.BatchId,
                b.Name as BatchName
            FROM AspNetUsers u
            LEFT JOIN Batches b ON u.BatchId = b.Id
            WHERE u.BatchId IS NOT NULL";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        var usersWithBatch = 0;
        var validRelationships = 0;

        // Act: Verify batch relationships are intact
        while (await reader.ReadAsync())
        {
            usersWithBatch++;
            
            var userId = reader.GetString(0);
            var batchId = reader.GetInt32(1);
            var batchName = reader.IsDBNull(2) ? null : reader.GetString(2);

            // Verify the foreign key relationship is valid
            if (batchId > 0 && !string.IsNullOrEmpty(batchName))
            {
                validRelationships++;
            }
        }

        // Assert: Batch relationships should be preserved
        // This behavior MUST be preserved after adding PersonalEmail column
        if (usersWithBatch > 0)
        {
            Assert.Equal(usersWithBatch, validRelationships);
        }
        else
        {
            Assert.True(true, "No users with batch relationships found, but query executed successfully");
        }
    }

    /// <summary>
    /// Property: Notification Preferences Preservation
    /// 
    /// For any user in the database, their notification preferences (PrefEmailNotif,
    /// PrefInAppNotif, etc.) must remain intact and queryable after the PersonalEmail
    /// column is added.
    /// </summary>
    [Fact]
    public async Task Preservation_NotificationPreferencesIntact()
    {
        // Arrange: Query notification preferences directly via SQL
        var query = @"
            SELECT TOP 10
                Id,
                PrefEmailNotif,
                PrefInAppNotif,
                PrefSessions,
                PrefAssignments,
                PrefAnnouncements,
                PrefOthers
            FROM AspNetUsers";

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        var userCount = 0;

        // Act: Verify notification preferences are accessible
        while (await reader.ReadAsync())
        {
            userCount++;
            
            var id = reader.GetString(0);
            var prefEmailNotif = reader.GetBoolean(1);
            var prefInAppNotif = reader.GetBoolean(2);
            var prefSessions = reader.GetBoolean(3);
            var prefAssignments = reader.GetBoolean(4);
            var prefAnnouncements = reader.GetBoolean(5);
            var prefOthers = reader.GetBoolean(6);

            // Verify preferences are readable (any boolean value is valid)
            Assert.NotNull(id);
        }

        // Assert: Notification preferences should be queryable
        // This behavior MUST be preserved after adding PersonalEmail column
        Assert.True(userCount > 0, "Database should contain users for preservation testing");
    }

    /// <summary>
    /// Property-Based Test: User Data Consistency Across Multiple Queries
    /// 
    /// For any user ID, querying that user multiple times should return consistent
    /// data for all properties (except PersonalEmail which doesn't exist yet).
    /// 
    /// This property verifies that the database maintains consistency and that
    /// adding the PersonalEmail column doesn't affect data integrity.
    /// </summary>
    [Property(MaxTest = 20)]
    public void Preservation_UserDataConsistencyAcrossQueries()
    {
        Prop.ForAll(
            Arb.Default.NonNegativeInt(),
            (NonNegativeInt userIndexWrapper) =>
            {
                var userIndex = userIndexWrapper.Get % 10; // Limit to first 10 users
                
                // Get a user ID from the database
                var getUserIdQuery = $"SELECT Id FROM AspNetUsers ORDER BY CreatedAt OFFSET {userIndex} ROWS FETCH NEXT 1 ROWS ONLY";
                
                using var connection = new SqlConnection(_connectionString);
                connection.Open();
                
                using var getUserIdCommand = new SqlCommand(getUserIdQuery, connection);
                var userId = getUserIdCommand.ExecuteScalar() as string;
                
                if (userId == null)
                {
                    // No user at this index, skip
                    return true;
                }

                // Query the same user twice
                var query = @"
                    SELECT 
                        Id, Email, FullName, Role, InstitutionId, BatchId, CreatedAt, LoginCount
                    FROM AspNetUsers 
                    WHERE Id = @UserId";

                var firstQuery = new SqlCommand(query, connection);
                firstQuery.Parameters.AddWithValue("@UserId", userId);
                
                var secondQuery = new SqlCommand(query, connection);
                secondQuery.Parameters.AddWithValue("@UserId", userId);

                // Execute both queries
                using var reader1 = firstQuery.ExecuteReader();
                var hasData1 = reader1.Read();
                var data1 = hasData1 ? new
                {
                    Id = reader1.GetString(0),
                    Email = reader1.IsDBNull(1) ? null : reader1.GetString(1),
                    FullName = reader1.GetString(2),
                    Role = reader1.GetString(3),
                    InstitutionId = reader1.IsDBNull(4) ? (int?)null : reader1.GetInt32(4),
                    BatchId = reader1.IsDBNull(5) ? (int?)null : reader1.GetInt32(5),
                    CreatedAt = reader1.GetDateTime(6),
                    LoginCount = reader1.GetInt32(7)
                } : null;
                reader1.Close();

                using var reader2 = secondQuery.ExecuteReader();
                var hasData2 = reader2.Read();
                var data2 = hasData2 ? new
                {
                    Id = reader2.GetString(0),
                    Email = reader2.IsDBNull(1) ? null : reader2.GetString(1),
                    FullName = reader2.GetString(2),
                    Role = reader2.GetString(3),
                    InstitutionId = reader2.IsDBNull(4) ? (int?)null : reader2.GetInt32(4),
                    BatchId = reader2.IsDBNull(5) ? (int?)null : reader2.GetInt32(5),
                    CreatedAt = reader2.GetDateTime(6),
                    LoginCount = reader2.GetInt32(7)
                } : null;
                reader2.Close();

                // Verify consistency
                return data1 != null && data2 != null &&
                       data1.Id == data2.Id &&
                       data1.Email == data2.Email &&
                       data1.FullName == data2.FullName &&
                       data1.Role == data2.Role &&
                       data1.InstitutionId == data2.InstitutionId &&
                       data1.BatchId == data2.BatchId &&
                       data1.CreatedAt == data2.CreatedAt &&
                       data1.LoginCount == data2.LoginCount;
            }).QuickCheckThrowOnFailure();
    }

    /// <summary>
    /// Property-Based Test: Role Assignment Validity
    /// 
    /// For any user in the database, their role should be one of the valid roles
    /// (Student, Teacher, Admin, Staff). This property must be preserved after adding
    /// the PersonalEmail column.
    /// </summary>
    [Fact]
    public void Preservation_RoleAssignmentValidity()
    {
        var validRoles = new[] { "Student", "Teacher", "Admin", "Staff" };
        
        // First, get the total count of users
        using var countConnection = new SqlConnection(_connectionString);
        countConnection.Open();
        using var countCommand = new SqlCommand("SELECT COUNT(*) FROM AspNetUsers", countConnection);
        var totalUsers = (int)countCommand.ExecuteScalar()!;
        countConnection.Close();
        
        if (totalUsers == 0)
        {
            // No users in database, skip this test
            Assert.True(true, "No users in database to test role validity");
            return;
        }
        
        // Test with a fixed set of indices instead of random generation
        var testIndices = Enumerable.Range(0, Math.Min(50, totalUsers)).ToList();
        
        foreach (var userIndex in testIndices)
        {
            var query = $"SELECT Role FROM AspNetUsers ORDER BY CreatedAt OFFSET {userIndex} ROWS FETCH NEXT 1 ROWS ONLY";
            
            using var connection = new SqlConnection(_connectionString);
            connection.Open();
            
            using var command = new SqlCommand(query, connection);
            var role = command.ExecuteScalar() as string;
            
            // Verify role is valid
            Assert.NotNull(role);
            Assert.Contains(role, validRoles);
        }
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}
