using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using back_end.Models;
using back_end.Services; 
using back_end.Helpers; 
using Microsoft.Extensions.Configuration;
namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactsController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly EmailService _emailService; 
        private readonly IConfiguration _configuration;

        public ContactsController(
            DbplantShopThuanCuongContext context,
            EmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        //Lấy danh sách liên hệ 
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

        //Lấy chi tiết 
        [HttpGet("{id}")]
        public async Task<ActionResult<TblContact>> GetContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            // Tự động đánh dấu đã đọc nếu đang là New 
            if (contact.Status == "New")
            {
                contact.Status = "Read";
                await _context.SaveChangesAsync();
            }

            return contact;
        }

        //Cập nhật trạng thái 
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            contact.Status = newStatus;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        //Xóa liên hệ 
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            _context.TblContacts.Remove(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa tin nhắn liên hệ." });
        }

        //API User gửi tin 
        [HttpPost]
        public async Task<IActionResult> CreateContact([FromBody] ContactSubmissionDto request)
        {

            //Lấy cấu hình đã mã hóa từ DB
            var configRecaptcha = await _context.TblSystemConfigs
                .FirstOrDefaultAsync(x => x.ConfigKey == "Recaptcha_SecretKey");

            if (configRecaptcha == null || string.IsNullOrEmpty(configRecaptcha.ConfigValue))
            {
                return StatusCode(500, new { message = "Lỗi hệ thống: Chưa cấu hình Recaptcha Secret Key." });
            }

            //Lấy secretKey từ appsettings.json để giải mã
            string appSecretKey = _configuration["AppSettings:SecretKey"];
            if (string.IsNullOrEmpty(appSecretKey))
            {
                return StatusCode(500, new { message = "Lỗi hệ thống: Chưa cấu hình App Secret Key." });
            }

            //Giải mã để lấy Google Secret key thật
            string googleSecretKey;
            try
            {
                googleSecretKey = SecurityHelper.Decrypt(configRecaptcha.ConfigValue, appSecretKey);
            }
            catch
            {
                return StatusCode(500, new { message = "Lỗi hệ thống: Không thể giải mã key bảo mật." });
            }

            //gọi lại hàm với KEy vừa đc lấy
            var isCaptchaValid = await VerifyCaptcha(request.RecaptchaToken, googleSecretKey);

            if (!isCaptchaValid)
            {
                return BadRequest(new { message = "Xác thực Captcha thất bại. Vui lòng thử lại." });
            }

            //lưu vào db
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

            return CreatedAtAction("GetContact", new { id = contact.ContactId }, contact);
        }


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


    

        // API Phản hồi liên hệ 
        [HttpPost("reply/{id}")]
        public async Task<IActionResult> ReplyContact(int id, [FromBody] ReplyContactRequest request)
        {
            var contact = await _context.TblContacts.FindAsync(id);
            if (contact == null) return NotFound();

            try
            {
                string emailSubject = "Phản hồi: " + request.Subject;
                string emailBody = $@"
                    <h3>Chào {contact.FullName},</h3>
                    <p>{request.Message.Replace("\n", "<br/>")}</p>
                    <br/>
                    <p>Trân trọng,<br/>Đội ngũ Admin.</p>
                ";

                //gọi email service (lấy pass từ DB, giải mã và gửi)
                await _emailService.SendEmailAsync(contact.Email, emailSubject, emailBody);


                contact.Status = "Replied";
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã gửi email phản hồi thành công!" });
            }
            catch (Exception ex)
            {
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
        public string RecaptchaToken { get; set; } 
    }
}