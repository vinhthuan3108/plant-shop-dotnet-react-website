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

            // Khởi tạo PayOS với key từ appsettings.json
            string clientId = configuration["PayOS:ClientId"] ?? "";
            string apiKey = configuration["PayOS:ApiKey"] ?? "";
            string checksumKey = configuration["PayOS:ChecksumKey"] ?? "";

            _payOS = new PayOS(clientId, apiKey, checksumKey);
        }

        // 1. TẠO LINK THANH TOÁN (Gọi API này sau khi tạo đơn hàng xong)
        [HttpPost("create-payment-link")]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentRequest req)
        {
            try
            {
                // Lấy thông tin đơn hàng từ DB
                var order = await _context.TblOrders
                    .Include(o => o.TblOrderDetails)
                    .ThenInclude(od => od.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == req.OrderId);

                if (order == null) return NotFound("Không tìm thấy đơn hàng");
                if (order.TotalAmount <= 0) return BadRequest("Số tiền không hợp lệ");

                // Tạo danh sách sản phẩm cho PayOS
                List<ItemData> items = new List<ItemData>();
                foreach (var detail in order.TblOrderDetails)
                {
                    items.Add(new ItemData(detail.Product.ProductName, (int)detail.Quantity, (int)detail.PriceAtTime));
                }

                // Lưu ý: PayOS yêu cầu OrderCode là số nguyên (long). 
                // Ta dùng luôn OrderId của mình (hoặc tạo mã random nếu muốn giấu ID thật)
                long orderCode = order.OrderId;

                // Cấu hình đường dẫn trả về (Frontend React)
                // Domain này là domain Frontend (React), không phải Backend
                string domain = "http://localhost:5173";

                PaymentData paymentData = new PaymentData(
                    orderCode: orderCode,
                    amount: (int)(order.TotalAmount ?? 0),
                    description: $"Thanh toan don {orderCode}",
                    items: items,
                    cancelUrl: $"{domain}/payment-cancel",  // Khi khách hủy -> về trang này
                    returnUrl: $"{domain}/payment-success"  // Khi thành công -> về trang này
                );

                CreatePaymentResult createPayment = await _payOS.createPaymentLink(paymentData);

                return Ok(new
                {
                    checkoutUrl = createPayment.checkoutUrl
                });
            }
            catch (Exception ex)
            {
                return BadRequest("Lỗi tạo link thanh toán: " + ex.Message);
            }
        }

        // 2. WEBHOOK (PayOS gọi vào đây khi thanh toán thành công)
        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook([FromBody] WebhookType body)
        {
            try
            {
                // Verify Webhook (Quan trọng: chống giả mạo request)
                WebhookData data = _payOS.verifyPaymentWebhookData(body);

                // Nếu verify thành công, code sẽ chạy tiếp xuống dưới.
                // data.orderCode chính là OrderId mình gửi đi lúc tạo link

                // Tìm đơn hàng trong DB
                int orderId = (int)data.orderCode;
                var order = await _context.TblOrders.FindAsync(orderId);

                if (order != null)
                {
                    // Kiểm tra trạng thái giao dịch
                    // "00" là thành công (theo quy định PayOS, hoặc check library)
                    // Tuy nhiên verifyPaymentWebhookData trả về data nghĩa là đã thành công rồi.

                    // Cập nhật trạng thái đơn hàng
                    if (order.PaymentStatus != "Paid")
                    {
                        order.PaymentStatus = "Paid"; // Đã thanh toán
                        order.OrderStatus = "Processing"; // Chuyển sang đang xử lý (hoặc Confirmed)
                        order.Note += $" | Đã thanh toán qua PayOS lúc {DateTime.Now}";

                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new { message = "Webhook processed" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Webhook Error: " + ex.Message);
                return Ok(new { message = "Webhook error but received" }); // Luôn trả về 200 để PayOS không gửi lại
            }
        }
    }

    public class CreatePaymentRequest
    {
        public int OrderId { get; set; }
    }
}