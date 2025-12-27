using back_end.Models;
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
        private readonly PayOS _payOS;
        private readonly DbplantShopThuanCuongContext _context;

        public PaymentController(IConfiguration configuration, DbplantShopThuanCuongContext context)
        {
            _context = context;

            string clientId = configuration["PayOS:ClientId"] ?? "";
            string apiKey = configuration["PayOS:ApiKey"] ?? "";
            string checksumKey = configuration["PayOS:ChecksumKey"] ?? "";

            _payOS = new PayOS(clientId, apiKey, checksumKey);
        }

        [HttpPost("create-payment-link")]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentRequest req)
        {
            try
            {
                var order = await _context.TblOrders
                    .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Variant) // 1. Include Variant
                        .ThenInclude(v => v.Product) // 2. Include Product cha để lấy tên
                    .FirstOrDefaultAsync(o => o.OrderId == req.OrderId);

                if (order == null) return NotFound("Không tìm thấy đơn hàng");
                if (order.TotalAmount <= 0) return BadRequest("Số tiền không hợp lệ");

                List<ItemData> items = new List<ItemData>();
                foreach (var detail in order.TblOrderDetails)
                {
                    // Lấy tên sản phẩm + tên biến thể
                    string productName = detail.Variant.Product.ProductName;
                    if (detail.Variant.VariantName != "Tiêu chuẩn")
                    {
                        productName += $" ({detail.Variant.VariantName})";
                    }

                    // Lưu ý: PayOS giới hạn độ dài tên sản phẩm, nên cắt ngắn nếu cần
                    if (productName.Length > 50) productName = productName.Substring(0, 47) + "...";

                    items.Add(new ItemData(productName, (int)detail.Quantity, (int)detail.PriceAtTime));
                }

                long orderCode = order.OrderId;
                string domain = "http://localhost:5173";

                PaymentData paymentData = new PaymentData(
                    orderCode: orderCode,
                    amount: (int)(order.TotalAmount ?? 0),
                    description: $"Thanh toan don {orderCode}",
                    items: items,
                    cancelUrl: $"{domain}/payment-cancel",
                    returnUrl: $"{domain}/payment-success"
                );

                CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);

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
                WebhookData data = _payOS.verifyPaymentWebhookData(body);
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