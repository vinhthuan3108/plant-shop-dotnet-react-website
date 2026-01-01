using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using back_end.Services; // 1. Nhớ using namespace chứa EmailService
using back_end.Helpers; // 1. Thêm namespace chứa SecurityHelper
using Microsoft.Extensions.Configuration;
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly EmailService _emailService; // 2. Khai báo service
        private readonly IConfiguration _configuration;
        // 3. Inject EmailService vào Constructor
        public ContactsController(
            DbplantShopThuanCuongContext context,
            EmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        // 1. Lấy danh sách liên hệ (Giữ nguyên)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TblContact>>> GetContacts(string? search, string? status)
        {
            var query = _context.TblContacts.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.FullName.Contains(search) || c.Email.Contains(search));
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(c => c.Status == status);
            }

            return await query.OrderByDescending(c => c.SentAt).ToListAsync();
        }

        // 2. Lấy chi tiết (Giữ nguyên)
        [HttpGet("{id}")]
        public async Task<ActionResult<TblContact>> GetContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            // Tự động đánh dấu đã đọc nếu đang là New (Optional logic)
            if (contact.Status == "New")
            {
                contact.Status = "Read";
                await _context.SaveChangesAsync();
            }

            return contact;
        }

        // 3. Cập nhật trạng thái (Giữ nguyên)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            contact.Status = newStatus;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        // 4. Xóa liên hệ (Giữ nguyên)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            _context.TblContacts.Remove(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa tin nhắn liên hệ." });
        }

        // 5. API User gửi tin (Giữ nguyên)
        [HttpPost]
        public async Task<IActionResult> CreateContact([FromBody] ContactSubmissionDto request)
        {
            // --- BƯỚC 1: LẤY SECRET KEY TỪ DB VÀ GIẢI MÃ ---

            // a. Lấy cấu hình đã mã hóa từ DB
            var configRecaptcha = await _context.TblSystemConfigs
                .FirstOrDefaultAsync(x => x.ConfigKey == "Recaptcha_SecretKey");

            if (configRecaptcha == null || string.IsNullOrEmpty(configRecaptcha.ConfigValue))
            {
                // Nếu chưa cấu hình trong DB thì báo lỗi server (hoặc log lại)
                return StatusCode(500, new { message = "Lỗi hệ thống: Chưa cấu hình Recaptcha Secret Key." });
            }

            // b. Lấy Master Key từ appsettings.json để giải mã
            string appSecretKey = _configuration["AppSettings:SecretKey"];
            if (string.IsNullOrEmpty(appSecretKey))
            {
                return StatusCode(500, new { message = "Lỗi hệ thống: Chưa cấu hình App Secret Key." });
            }

            // c. Giải mã để lấy Google Secret Key thật
            string googleSecretKey;
            try
            {
                googleSecretKey = SecurityHelper.Decrypt(configRecaptcha.ConfigValue, appSecretKey);
            }
            catch
            {
                return StatusCode(500, new { message = "Lỗi hệ thống: Không thể giải mã key bảo mật." });
            }

            // --- BƯỚC 2: GỌI HÀM VERIFY VỚI KEY VỪA LẤY ĐƯỢC ---
            var isCaptchaValid = await VerifyCaptcha(request.RecaptchaToken, googleSecretKey);

            if (!isCaptchaValid)
            {
                return BadRequest(new { message = "Xác thực Captcha thất bại. Vui lòng thử lại." });
            }

            // --- BƯỚC 3: LƯU VÀO DB (NHƯ CŨ) ---
            var contact = new TblContact
            {
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Message = request.Message,
                Subject = request.Subject,
                SentAt = DateTime.Now,
                Status = "New"
            };

            _context.TblContacts.Add(contact);
            await _context.SaveChangesAsync();

            // Gửi email thông báo cho Admin (Optional - nếu muốn)
            // await _emailService.SendEmailAsync("admin@domain.com", "Có liên hệ mới", "...");

            return CreatedAtAction("GetContact", new { id = contact.ContactId }, contact);
        }

        // Hàm phụ trợ để gọi sang Google (Copy hàm này vào trong Class Controller)
        // Sửa lại hàm này trong ContactsController.cs
        private async Task<bool> VerifyCaptcha(string token, string secretKey)
        {
            if (string.IsNullOrEmpty(token)) return false;

            using (var client = new HttpClient())
            {
                // Dùng secretKey được truyền vào (đã giải mã)
                var response = await client.GetStringAsync($"https://www.google.com/recaptcha/api/siteverify?secret={secretKey}&response={token}");

                var jsonResult = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(response);

                try
                {
                    return (bool)jsonResult.success;
                }
                catch
                {
                    return false;
                }
            }
        }

        // ... [Giữ nguyên API ReplyContact] ...
    

        // 6. API Phản hồi liên hệ (SỬA ĐỔI QUAN TRỌNG)
        [HttpPost("reply/{id}")]
        public async Task<IActionResult> ReplyContact(int id, [FromBody] ReplyContactRequest request)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            try
            {
                // Chuẩn bị nội dung mail
                // Vì EmailService mặc định IsBodyHtml = true, nên ta dùng thẻ <br> để xuống dòng
                string emailSubject = "Phản hồi: " + request.Subject;
                string emailBody = $@"
                    <h3>Chào {contact.FullName},</h3>
                    <p>{request.Message.Replace("\n", "<br/>")}</p>
                    <br/>
                    <p>Trân trọng,<br/>Đội ngũ Admin.</p>
                ";

                // GỌI EMAIL SERVICE (Nó sẽ tự lo việc lấy pass từ DB, giải mã và gửi)
                await _emailService.SendEmailAsync(contact.Email, emailSubject, emailBody);

                // Cập nhật trạng thái trong DB
                contact.Status = "Replied";
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã gửi email phản hồi thành công!" });
            }
            catch (Exception ex)
            {
                // Log lỗi ra console để debug nếu cần
                Console.WriteLine(ex.Message);
                return BadRequest("Lỗi gửi email: " + ex.Message);
            }
        }
    }

    public class ReplyContactRequest
    {
        public string Subject { get; set; }
        public string Message { get; set; }
    }
    public class ContactSubmissionDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Message { get; set; }
        public string Subject { get; set; }
        public string RecaptchaToken { get; set; } // Nhận token từ React
    }
}