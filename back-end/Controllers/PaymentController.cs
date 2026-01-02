using back_end.Models;
using back_end.Helpers; 
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
        private readonly IConfiguration _configuration; 

        public PaymentController(IConfiguration configuration, DbplantShopThuanCuongContext context)
        {
            _context = context;
            _configuration = configuration;
        }

        
        private async Task<PayOS> GetPayOSAsync() //Lấy cấu hình từ DB và khởi tạo PayOS
        {
            //Lấy dữ liệu từ DB
            var clientIdConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ClientId");
            var apiKeyConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ApiKey");
            var checksumConfig = await _context.TblSystemConfigs.FirstOrDefaultAsync(x => x.ConfigKey == "PayOS_ChecksumKey");

            if (clientIdConfig == null || apiKeyConfig == null || checksumConfig == null)
            {
                throw new Exception("Chưa cấu hình PayOS trong hệ thống.");
            }

            string secretKey = _configuration["AppSettings:SecretKey"];

            //Giải mã
            string clientId = SecurityHelper.Decrypt(clientIdConfig.ConfigValue, secretKey);
            string apiKey = SecurityHelper.Decrypt(apiKeyConfig.ConfigValue, secretKey);
            string checksumKey = SecurityHelper.Decrypt(checksumConfig.ConfigValue, secretKey);

            return new PayOS(clientId, apiKey, checksumKey);
        }

        [HttpPost("create-payment-link")]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentRequest req)
        {
            try
            {
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
                //Khi deploy thật thì domain lấy từ config hoặc request(chắc tui sẽ xem lại)
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
                //khởi tạo payos(verify webhook cũng cần key)
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