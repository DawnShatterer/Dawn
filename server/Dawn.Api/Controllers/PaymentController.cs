using Dawn.Core.Entities;
using Dawn.Core.Interfaces;
using Dawn.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Dawn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly INotificationService _notificationService;

    public PaymentController(
        ApplicationDbContext context, 
        IConfiguration configuration, 
        IHttpClientFactory httpClientFactory,
        INotificationService notificationService)
    {
        _context = context;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Initiate a payment for a semester tuition invoice. Creates a pending PaymentRecord and returns the redirect URL.
    /// </summary>
    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate([FromBody] PaymentInitiateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        if (!dto.SemesterInvoiceId.HasValue)
        {
            return BadRequest(new { Message = "Institutional LMS mode only accepts tuition invoice payments." });
        }

        var invoice = await _context.SemesterInvoices.FindAsync(dto.SemesterInvoiceId.Value);
        if (invoice == null) return NotFound(new { Message = "Invoice not found." });
        if (invoice.IsPaid) return BadRequest(new { Message = "This invoice is already paid." });
        if (invoice.StudentId != userId) return Unauthorized("Not your invoice.");
        
        decimal finalAmount = invoice.AmountNpr;
        string itemName = invoice.Description;

        // Create a unique transaction UUID
        var transactionUuid = Guid.NewGuid().ToString();

        // Create pending payment record
        var payment = new PaymentRecord
        {
            StudentId = userId,
            SemesterInvoiceId = invoice.Id,
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
            return Ok(GenerateEsewaPayload(payment, itemName, transactionUuid, frontendBase, backendBase));
        }
        else if (dto.Gateway.ToLower() == "khalti")
        {
            var result = await InitiateKhaltiPayment(payment, itemName, transactionUuid, frontendBase);
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

            payment.Status = "Completed";
            payment.CompletedAt = DateTime.UtcNow;

            if (payment.SemesterInvoiceId.HasValue)
            {
                var invoice = await _context.SemesterInvoices.FindAsync(payment.SemesterInvoiceId.Value);
                if (invoice != null)
                {
                    invoice.IsPaid = true;
                    invoice.PaidAt = DateTime.UtcNow;
                    invoice.ESewaTransactionId = payment.TransactionId;
                }
            }

            await _context.SaveChangesAsync();

            // Generate and send PDF Invoice
            _ = Task.Run(() => GenerateAndSendInvoiceAsync(payment));

            return Redirect($"{frontendUrl}/payment-success?invoiceId={payment.SemesterInvoiceId}&gateway=esewa");
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

            if (payment.SemesterInvoiceId.HasValue)
            {
                var invoice = await _context.SemesterInvoices.FindAsync(payment.SemesterInvoiceId.Value);
                if (invoice != null)
                {
                    invoice.IsPaid = true;
                    invoice.PaidAt = DateTime.UtcNow;
                    invoice.ESewaTransactionId = payment.TransactionId; // store the khalti one too
                }
            }

            await _context.SaveChangesAsync();

            // Generate and send PDF Invoice
            _ = Task.Run(() => GenerateAndSendInvoiceAsync(payment));

            return Redirect($"{frontendUrl}/payment-success?invoiceId={payment.SemesterInvoiceId}&gateway=khalti");
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
            .Include(p => p.SemesterInvoice)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                CourseName = p.SemesterInvoice != null ? p.SemesterInvoice.Description : "Payment",
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

    /// <summary>
    /// Verify payment status for frontend display
    /// </summary>
    [HttpGet("verify")]
    public async Task<IActionResult> VerifyPaymentStatus(
        [FromQuery] int invoiceId, 
        [FromQuery] string gateway)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        
        // Validate gateway
        if (gateway != "esewa" && gateway != "khalti")
        {
            return BadRequest(new { 
                success = false, 
                message = "Invalid gateway specified" 
            });
        }
        
        // Find the invoice
        var invoice = await _context.SemesterInvoices
            .Include(i => i.Student)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);
        
        if (invoice == null)
        {
            return NotFound(new { 
                success = false, 
                message = "Invoice not found" 
            });
        }
        
        // Verify ownership
        if (invoice.StudentId != userId)
        {
            return Unauthorized(new { 
                success = false, 
                message = "Not authorized to view this invoice" 
            });
        }
        
        // Check if invoice is paid
        if (!invoice.IsPaid)
        {
            return Ok(new { 
                success = false, 
                message = "Payment not completed",
                retryable = true
            });
        }
        
        // Find the payment record
        var payment = await _context.PaymentRecords
            .Where(p => p.SemesterInvoiceId == invoiceId && p.Status == "Completed")
            .OrderByDescending(p => p.CompletedAt)
            .FirstOrDefaultAsync();
        
        if (payment == null)
        {
            return Ok(new { 
                success = false, 
                message = "Payment record not found",
                retryable = false
            });
        }
        
        // Return verified payment details
        return Ok(new
        {
            success = true,
            invoiceId = invoice.Id,
            amount = payment.Amount,
            gateway = payment.Gateway,
            transactionId = payment.TransactionId,
            timestamp = payment.CompletedAt,
            courseName = invoice.Description,
            studentName = invoice.Student?.FullName
        });
    }

    /// <summary>
    /// Verify payment failure reason (optional endpoint)
    /// </summary>
    [HttpGet("verify-failure")]
    public IActionResult VerifyPaymentFailure([FromQuery] string reason)
    {
        // Map reason codes to user-friendly messages
        var reasonMessages = new Dictionary<string, string>
        {
            { "esewa_cancelled", "The eSewa payment was cancelled or not completed." },
            { "khalti_cancelled", "The Khalti payment was cancelled or not completed." },
            { "verification_failed", "Payment verification failed. Please contact support." },
            { "payment_not_found", "The payment record could not be found." },
            { "payment_incomplete", "The payment was not fully completed." },
            { "khalti_lookup_failed", "Khalti payment verification failed." },
            { "server_error", "An unexpected server error occurred." },
            { "unknown", "The payment could not be processed." }
        };
        
        var message = reasonMessages.ContainsKey(reason) 
            ? reasonMessages[reason] 
            : reasonMessages["unknown"];
        
        return Ok(new
        {
            success = false,
            reason = reason,
            message = message,
            retryable = !new[] { "verification_failed", "server_error" }.Contains(reason)
        });
    }

    // ──── HELPER METHODS ────

    private object GenerateEsewaPayload(PaymentRecord payment, string itemName, string transactionUuid, string frontendBase, string backendBase)
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

    private async Task<object> InitiateKhaltiPayment(PaymentRecord payment, string itemName, string transactionUuid, string frontendBase)
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
            purchase_order_name = itemName,
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
    private async Task GenerateAndSendInvoiceAsync(PaymentRecord payment)
    {
        try
        {
            var student = await _context.Users.FindAsync(payment.StudentId);
            if (student == null || string.IsNullOrEmpty(student.Email)) return;
            string title = "";
            if (payment.SemesterInvoiceId.HasValue) {
                var invoice = await _context.SemesterInvoices.FindAsync(payment.SemesterInvoiceId.Value);
                title = invoice?.Description ?? "Semester Tuition";
            }

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header().Text("Dawn Platform Invoice")
                        .SemiBold().FontSize(24).FontColor(Colors.Blue.Darken2);

                    page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
                    {
                        x.Spacing(20);

                        x.Item().Text($"Invoice Number: {payment.TransactionId}");
                        x.Item().Text($"Date: {payment.CompletedAt:yyyy-MM-dd HH:mm}");
                        x.Item().Text($"Customer: {student.FullName} ({student.Email})");

                        x.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.ConstantColumn(100);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Course").SemiBold();
                                header.Cell().AlignRight().Text("Price (NPR)").SemiBold();
                            });

                            table.Cell().Text(title);
                            table.Cell().AlignRight().Text($"{payment.Amount:F2}");
                        });

                        x.Item().AlignRight().Text($"Total Paid: Rs. {payment.Amount:F2} via {payment.Gateway}")
                            .SemiBold().FontSize(14);
                    });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                            x.Span(" of ");
                            x.TotalPages();
                        });
                });
            });

            byte[] pdfBytes = document.GeneratePdf();

            using var scope = HttpContext.RequestServices.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            
            await emailService.SendEmailWithAttachmentAsync(
                student.Email!,
                $"Your Receipt for {title}",
                $"Hi {student.FullName},\n\nThank you for your payment! Please find your receipt attached.\n\nBest,\nDawn Platform Team",
                $"Receipt_{payment.TransactionId}.pdf",
                pdfBytes
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to generate invoice: {ex.Message}");
        }
    }
}

// ──── DTOs ────

public class PaymentInitiateDto
{
    public int? SemesterInvoiceId { get; set; }
    public string Gateway { get; set; } = string.Empty;
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
