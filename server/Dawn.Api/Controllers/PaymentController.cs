using Dawn.Core.Entities;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Dawn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public PaymentController(ApplicationDbContext context, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Initiate a payment for a course. Creates a pending PaymentRecord and returns the redirect URL.
    /// </summary>
    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate([FromBody] PaymentInitiateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var course = await _context.Courses.FindAsync(dto.CourseId);
        if (course == null) return NotFound(new { Message = "Course not found." });

        if (course.Price <= 0)
            return BadRequest(new { Message = "This is a free course. Enroll directly." });

        // Check if already enrolled
        var alreadyEnrolled = await _context.Enrollments
            .AnyAsync(e => e.StudentId == userId && e.CourseId == dto.CourseId);
        if (alreadyEnrolled)
            return BadRequest(new { Message = "You are already enrolled in this course." });

        // Create a unique transaction UUID
        var transactionUuid = Guid.NewGuid().ToString();

        // Apply coupon discount if provided
        var finalAmount = course.Price;
        CourseCoupon? appliedCoupon = null;

        if (!string.IsNullOrWhiteSpace(dto.CouponCode))
        {
            appliedCoupon = await _context.CourseCoupons
                .FirstOrDefaultAsync(c => c.Code == dto.CouponCode && c.OwnerId == userId);

            if (appliedCoupon == null)
                return BadRequest(new { Message = "Coupon not found or does not belong to you." });
            if (appliedCoupon.IsUsed)
                return BadRequest(new { Message = "This coupon has already been used." });
            if (appliedCoupon.ExpiresAt < DateTime.UtcNow)
                return BadRequest(new { Message = "This coupon has expired." });

            var discount = finalAmount * appliedCoupon.DiscountPercent / 100;
            if (appliedCoupon.MaxDiscountAmount.HasValue && discount > appliedCoupon.MaxDiscountAmount.Value)
                discount = appliedCoupon.MaxDiscountAmount.Value;
            
            finalAmount -= discount;
            if (finalAmount < 10) finalAmount = 10; // eSewa minimum is 10 Rs

            // Mark coupon as used
            appliedCoupon.IsUsed = true;
            appliedCoupon.UsedOnCourseId = dto.CourseId;
            appliedCoupon.UsedAt = DateTime.UtcNow;
        }

        // Create pending payment record
        var payment = new PaymentRecord
        {
            StudentId = userId,
            CourseId = dto.CourseId,
            Amount = finalAmount,
            Gateway = dto.Gateway.ToLower(),
            TransactionId = transactionUuid,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.PaymentRecords.Add(payment);
        await _context.SaveChangesAsync();

        var frontendBase = dto.FrontendBaseUrl?.TrimEnd('/') ?? "http://localhost:5174";
        var backendBase = dto.BackendBaseUrl?.TrimEnd('/') ?? "http://localhost:5159";

        if (dto.Gateway.ToLower() == "esewa")
        {
            return Ok(GenerateEsewaPayload(payment, course, transactionUuid, frontendBase, backendBase));
        }
        else if (dto.Gateway.ToLower() == "khalti")
        {
            var result = await InitiateKhaltiPayment(payment, course, transactionUuid, frontendBase);
            return Ok(result);
        }

        return BadRequest(new { Message = "Invalid gateway. Use 'esewa' or 'khalti'." });
    }

    /// <summary>
    /// eSewa redirects here after payment. We verify server-side and then redirect browser to frontend.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("esewa/verify")]
    public async Task<IActionResult> VerifyEsewa([FromQuery] string data)
    {
        var frontendUrl = _configuration["FrontendBaseUrl"] ?? "http://localhost:5174";
        try
        {
            // eSewa sends a base64-encoded JSON string
            var decodedBytes = Convert.FromBase64String(data);
            var decodedJson = Encoding.UTF8.GetString(decodedBytes);
            var esewaResponse = JsonSerializer.Deserialize<EsewaVerifyResponse>(decodedJson);

            if (esewaResponse == null)
                return Redirect($"{frontendUrl}/payment-failed?reason=invalid_response");

            var payment = await _context.PaymentRecords
                .FirstOrDefaultAsync(p => p.TransactionId == esewaResponse.transaction_uuid);

            if (payment == null)
                return Redirect($"{frontendUrl}/payment-failed?reason=payment_not_found");

            // Check eSewa status first
            if (esewaResponse.status != "COMPLETE")
            {
                payment.Status = "Failed";
                await _context.SaveChangesAsync();
                return Redirect($"{frontendUrl}/payment-failed?reason=payment_incomplete");
            }

            // Verify using eSewa's transaction status check API as the primary method
            var esewaBase = _configuration["PaymentGateways:eSewa:BaseUrl"]!;
            var merchantCode = _configuration["PaymentGateways:eSewa:MerchantCode"]!;

            var client = _httpClientFactory.CreateClient();
            var statusCheckUrl = $"{esewaBase}/api/epay/transaction/status/?product_code={merchantCode}&total_amount={esewaResponse.total_amount}&transaction_uuid={esewaResponse.transaction_uuid}";
            
            var statusResponse = await client.GetAsync(statusCheckUrl);
            
            bool verified = false;
            if (statusResponse.IsSuccessStatusCode)
            {
                var statusBody = await statusResponse.Content.ReadAsStringAsync();
                try
                {
                    using var doc = JsonDocument.Parse(statusBody);
                    if (doc.RootElement.TryGetProperty("status", out var statusProp) && 
                        statusProp.GetString() == "COMPLETE")
                    {
                        verified = true;
                    }
                }
                catch (Exception)
                {
                    // Ignore parsing error, we have the fallback HMAC below
                }
            }

            // Fallback: also try HMAC signature verification
            if (!verified)
            {
                var secretKey = _configuration["PaymentGateways:eSewa:SecretKey"]!;
                var message = $"total_amount={esewaResponse.total_amount},transaction_uuid={esewaResponse.transaction_uuid},product_code={esewaResponse.product_code}";
                var expectedSignature = GenerateHmacSha256(message, secretKey);

                if (expectedSignature == esewaResponse.signature)
                {
                    verified = true;
                }
            }

            if (!verified)
            {
                payment.Status = "Failed";
                await _context.SaveChangesAsync();
                return Redirect($"{frontendUrl}/payment-failed?reason=verification_failed");
            }

            // Payment verified! Mark as completed and auto-enroll
            payment.Status = "Completed";
            payment.CompletedAt = DateTime.UtcNow;

            // Auto-enroll the student
            var alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == payment.StudentId && e.CourseId == payment.CourseId);

            if (!alreadyEnrolled)
            {
                _context.Enrollments.Add(new Enrollment
                {
                    StudentId = payment.StudentId,
                    CourseId = payment.CourseId,
                    EnrolledAt = DateTime.UtcNow,
                    Progress = 0
                });
            }

            await _context.SaveChangesAsync();

            // Award Dawn Points for the purchase
            var purchasedCourse = await _context.Courses.FindAsync(payment.CourseId);
            await PointsController.AwardPurchasePoints(_context, payment.StudentId, purchasedCourse?.Title ?? "Course");

            return Redirect($"{frontendUrl}/payment-success?courseId={payment.CourseId}&gateway=esewa");
        }
        catch (Exception)
        {
            return Redirect($"{frontendUrl}/payment-failed?reason=server_error");
        }
    }

    /// <summary>
    /// Khalti redirects here after payment. We verify via Khalti Lookup API.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("khalti/verify")]
    public async Task<IActionResult> VerifyKhalti(
        [FromQuery] string pidx,
        [FromQuery] string transaction_id,
        [FromQuery] string amount,
        [FromQuery] string purchase_order_id)
    {
        var frontendUrl = _configuration["FrontendBaseUrl"] ?? "http://localhost:5174";
        try
        {
            var payment = await _context.PaymentRecords
                .FirstOrDefaultAsync(p => p.TransactionId == purchase_order_id);

            if (payment == null)
                return Redirect($"{frontendUrl}/payment-failed?reason=payment_not_found");

            // Server-side verification via Khalti Lookup API
            var secretKey = _configuration["PaymentGateways:Khalti:SecretKey"]!;
            var khaltiBase = _configuration["PaymentGateways:Khalti:BaseUrl"]!;

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"key {secretKey}");

            var lookupContent = new StringContent(
                JsonSerializer.Serialize(new { pidx }),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync($"{khaltiBase}/api/v2/epayment/lookup/", lookupContent);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                payment.Status = "Failed";
                await _context.SaveChangesAsync();
                return Redirect($"{frontendUrl}/payment-failed?reason=khalti_lookup_failed");
            }

            var lookupResult = JsonSerializer.Deserialize<KhaltiLookupResponse>(responseBody);

            if (lookupResult?.status != "Completed")
            {
                payment.Status = "Failed";
                await _context.SaveChangesAsync();
                return Redirect($"{frontendUrl}/payment-failed?reason=payment_{lookupResult?.status?.ToLower()}");
            }

            // Payment verified!
            payment.Status = "Completed";
            payment.CompletedAt = DateTime.UtcNow;
            payment.TransactionId = purchase_order_id; // Keep our UUID as reference

            var alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == payment.StudentId && e.CourseId == payment.CourseId);

            if (!alreadyEnrolled)
            {
                _context.Enrollments.Add(new Enrollment
                {
                    StudentId = payment.StudentId,
                    CourseId = payment.CourseId,
                    EnrolledAt = DateTime.UtcNow,
                    Progress = 0
                });
            }

            await _context.SaveChangesAsync();

            // Award Dawn Points for the purchase
            var purchasedCourse = await _context.Courses.FindAsync(payment.CourseId);
            await PointsController.AwardPurchasePoints(_context, payment.StudentId, purchasedCourse?.Title ?? "Course");

            return Redirect($"{frontendUrl}/payment-success?courseId={payment.CourseId}&gateway=khalti");
        }
        catch (Exception)
        {
            return Redirect($"{frontendUrl}/payment-failed?reason=server_error");
        }
    }

    /// <summary>
    /// Get payment history for the logged-in user (for Profile Billing).
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetPaymentHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var payments = await _context.PaymentRecords
            .Where(p => p.StudentId == userId)
            .Include(p => p.Course)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                CourseName = p.Course.Title,
                p.Amount,
                p.Gateway,
                p.Status,
                p.TransactionId,
                p.CreatedAt,
                p.CompletedAt
            })
            .ToListAsync();

        return Ok(payments);
    }

    // ──── HELPER METHODS ────

    private object GenerateEsewaPayload(PaymentRecord payment, Course course, string transactionUuid, string frontendBase, string backendBase)
    {
        var merchantCode = _configuration["PaymentGateways:eSewa:MerchantCode"]!;
        var secretKey = _configuration["PaymentGateways:eSewa:SecretKey"]!;
        var esewaBase = _configuration["PaymentGateways:eSewa:BaseUrl"]!;

        var totalAmount = payment.Amount.ToString("F2");
        var message = $"total_amount={totalAmount},transaction_uuid={transactionUuid},product_code={merchantCode}";
        var signature = GenerateHmacSha256(message, secretKey);

        return new
        {
            gateway = "esewa",
            paymentUrl = $"{esewaBase}/api/epay/main/v2/form",
            formData = new
            {
                amount = totalAmount,
                tax_amount = "0",
                total_amount = totalAmount,
                transaction_uuid = transactionUuid,
                product_code = merchantCode,
                product_service_charge = "0",
                product_delivery_charge = "0",
                success_url = $"{backendBase}/api/Payment/esewa/verify",
                failure_url = $"{frontendBase}/payment-failed?reason=esewa_cancelled",
                signed_field_names = "total_amount,transaction_uuid,product_code",
                signature = signature
            }
        };
    }

    private async Task<object> InitiateKhaltiPayment(PaymentRecord payment, Course course, string transactionUuid, string frontendBase)
    {
        var secretKey = _configuration["PaymentGateways:Khalti:SecretKey"]!;
        var khaltiBase = _configuration["PaymentGateways:Khalti:BaseUrl"]!;
        var backendBase = _configuration.GetValue<string>("BackendBaseUrl") ?? "http://localhost:5159";

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"key {secretKey}");

        var amountInPaisa = (int)(payment.Amount * 100); // Khalti expects paisa

        var payload = new
        {
            return_url = $"{backendBase}/api/Payment/khalti/verify",
            website_url = frontendBase,
            amount = amountInPaisa,
            purchase_order_id = transactionUuid,
            purchase_order_name = course.Title,
            customer_info = new
            {
                name = "Dawn Student",
                email = "student@dawn.com",
                phone = "9800000000"
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync($"{khaltiBase}/api/v2/epayment/initiate/", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            return new { error = true, message = "Failed to initiate Khalti payment.", details = responseBody };
        }

        var result = JsonSerializer.Deserialize<KhaltiInitiateResponse>(responseBody);

        return new
        {
            gateway = "khalti",
            paymentUrl = result?.payment_url,
            pidx = result?.pidx
        };
    }

    private static string GenerateHmacSha256(string message, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var messageBytes = Encoding.UTF8.GetBytes(message);

        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(messageBytes);
        return Convert.ToBase64String(hashBytes);
    }
}

// ──── DTOs ────

public class PaymentInitiateDto
{
    public int CourseId { get; set; }
    public string Gateway { get; set; } = string.Empty;
    public string? CouponCode { get; set; }
    public string? FrontendBaseUrl { get; set; }
    public string? BackendBaseUrl { get; set; }
}

public class EsewaVerifyResponse
{
    public string transaction_uuid { get; set; } = "";
    public string product_code { get; set; } = "";
    public string total_amount { get; set; } = "";
    public string status { get; set; } = "";
    public string signature { get; set; } = "";
}

public class KhaltiInitiateResponse
{
    public string? pidx { get; set; }
    public string? payment_url { get; set; }
}

public class KhaltiLookupResponse
{
    public string? pidx { get; set; }
    public string? status { get; set; }
    public int? total_amount { get; set; }
}
