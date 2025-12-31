using back_end.Models;
using back_end.Helpers; // Nhớ thêm namespace chứa SecurityHelper
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Net.payOS;
using Net.payOS.Types;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IConfiguration _configuration; // Cần cái này để lấy SecretKey giải mã

        public PaymentController(IConfiguration configuration, DbplantShopThuanCuongContext context)
        {
            _context = context;
            _configuration = configuration;
            // XÓA đoạn khởi tạo PayOS cũ ở đây đi
        }

        // --- HÀM HỖ TRỢ: Lấy cấu hình từ DB và khởi tạo PayOS ---
        private async Task<PayOS> GetPayOSAsync()
        {
            // 1. Lấy dữ liệu từ DB
            var clientIdConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ClientId");
            var apiKeyConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ApiKey");
            var checksumConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ChecksumKey");

            if (clientIdConfig == null || apiKeyConfig == null || checksumConfig == null)
            {
                throw new Exception("Chưa cấu hình PayOS trong hệ thống.");
            }

            // 2. Lấy SecretKey
            string secretKey = _configuration["AppSettings:SecretKey"];

            // 3. Giải mã CẢ 3 CÁI
            // Thay đổi ở đây: Decrypt ClientId
            string clientId = SecurityHelper.Decrypt(clientIdConfig.ConfigValue, secretKey);
            string apiKey = SecurityHelper.Decrypt(apiKeyConfig.ConfigValue, secretKey);
            string checksumKey = SecurityHelper.Decrypt(checksumConfig.ConfigValue, secretKey);

            // 4. Trả về đối tượng PayOS
            return new PayOS(clientId, apiKey, checksumKey);
        }

        [HttpPost("create-payment-link")]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentRequest req)
        {
            try
            {
                // KHỞI TẠO PayOS TỪ DB
                PayOS payOS = await GetPayOSAsync();

                var order = await _context.TblOrders
                    .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Variant)
                        .ThenInclude(v => v.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == req.OrderId);

                if (order == null) return NotFound("Không tìm thấy đơn hàng");
                if (order.TotalAmount <= 0) return BadRequest("Số tiền không hợp lệ");

                List<ItemData> items = new List<ItemData>();
                foreach (var detail in order.TblOrderDetails)
                {
                    string productName = detail.Variant.Product.ProductName;
                    if (detail.Variant.VariantName != "Tiêu chuẩn")
                    {
                        productName += $" ({detail.Variant.VariantName})";
                    }
                    if (productName.Length > 50) productName = productName.Substring(0, 47) + "...";
                    items.Add(new ItemData(productName, (int)detail.Quantity, (int)detail.PriceAtTime));
                }

                long orderCode = order.OrderId;
                // Lưu ý: Khi deploy thật thì domain này phải lấy từ config hoặc request
                string domain = "http://localhost:5173";

                PaymentData paymentData = new PaymentData(
                    orderCode: orderCode,
                    amount: (int)(order.TotalAmount ?? 0),
                    description: $"Thanh toan don {orderCode}",
                    items: items,
                    cancelUrl: $"{domain}/payment-cancel",
                    returnUrl: $"{domain}/payment-success"
                );

                CreatePaymentResult createPayment = await payOS.createPaymentLink(paymentData);

                return Ok(new { checkoutUrl = createPayment.checkoutUrl });
            }
            catch (Exception ex)
            {
                return BadRequest("Lỗi tạo link thanh toán: " + ex.Message);
            }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook([FromBody] WebhookType body)
        {
            try
            {
                // KHỞI TẠO PayOS TỪ DB (Để verify webhook cũng cần key)
                PayOS payOS = await GetPayOSAsync();

                WebhookData data = payOS.verifyPaymentWebhookData(body);
                int orderId = (int)data.orderCode;
                var order = await _context.TblOrders.FindAsync(orderId);

                if (order != null)
                {
                    if (order.PaymentStatus != "Paid")
                    {
                        order.PaymentStatus = "Paid";
                        order.OrderStatus = "Processing";
                        order.Note += $" | Đã thanh toán qua PayOS lúc {DateTime.Now:dd/MM/yyyy HH:mm}";

                        await _context.SaveChangesAsync();
                    }
                }
                return Ok(new { message = "Webhook processed" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Webhook Error: " + ex.Message);
                return Ok(new { message = "Webhook error but received" });
            }
        }
    }

    public class CreatePaymentRequest
    {
        public int OrderId { get; set; }
    }
}