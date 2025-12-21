using back_end.DTO;
using back_end.DTOs;
using back_end.Models;
using back_end.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly DbplantShopThuanCuongContext _context;
        private readonly IConfiguration _configuration; 


        private readonly EmailService _emailService;
        private readonly IMemoryCache _cache;
        public AuthController(DbplantShopThuanCuongContext context, IConfiguration configuration, EmailService emailService, IMemoryCache cache)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _cache = cache;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            if (await _context.TblUsers.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email đã tồn tại.");
            }

            string otp = new Random().Next(100000, 999999).ToString();


            _cache.Set(request.Email, otp, TimeSpan.FromMinutes(10));

            var user = new TblUser
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                RoleId = 2,
                IsActive = false, 
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.TblUsers.Add(user);
            await _context.SaveChangesAsync();

            await _emailService.SendEmailAsync(request.Email, "Mã xác thực", $"Mã OTP: {otp}");

            return Ok("Đăng ký thành công! Kiểm tra email.");
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _context.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest("Sai email hoặc mật khẩu.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest("Sai email hoặc mật khẩu.");
            }


            string token = CreateToken(user);

            return Ok(new
            {
                Token = token,
                FullName = user.FullName,
                Role = user.RoleId,
                UserId = user.UserId
            });
        }

        private string CreateToken(TblUser user)
        {
            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.RoleId.ToString()),
                new Claim("UserId", user.UserId.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetSection("AppSettings:Token").Value ?? "tokencuavinhthuanvamanhcuong-dsjfhjdfhshfhsfdfhsdfhsdhfsfskhfdjhfkshdfhsdfsdf"));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(1), 
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt;
        }
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp(VerifyDto request)
        {
            if (!_cache.TryGetValue(request.Email, out string savedOtp))
            {
                return BadRequest("Mã xác thực đã hết hạn hoặc không tồn tại.");
            }

            if (savedOtp != request.OtpCode)
            {
                return BadRequest("Mã xác thực không đúng.");
            }

            var user = await _context.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return BadRequest("Tài khoản lỗi.");

            user.IsActive = true;
            await _context.SaveChangesAsync();

            _cache.Remove(request.Email);

            return Ok("Kích hoạt thành công!");
        }
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto request)
        {
            // 1. Kiểm tra email có tồn tại trong hệ thống không
            var user = await _context.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest("Email không tồn tại trong hệ thống.");
            }

            // 2. Tạo mã OTP ngẫu nhiên
            string otp = new Random().Next(100000, 999999).ToString();

            // 3. Lưu OTP vào Cache với key riêng (ví dụ: RESET_email) để không trùng với OTP đăng ký
            // Thời hạn 10 phút
            string cacheKey = $"RESET_{request.Email}";
            _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(10));

            // 4. Gửi email
            try
            {
                await _emailService.SendEmailAsync(request.Email, "Yêu cầu đặt lại mật khẩu",
                    $"<h3>Mã xác nhận đặt lại mật khẩu của bạn là: <b style='color:red'>{otp}</b></h3>" +
                    $"<p>Mã này có hiệu lực trong 10 phút.</p>");
            }
            catch (Exception ex)
            {
                return BadRequest("Lỗi gửi email: " + ex.Message);
            }

            return Ok("Mã xác nhận đã được gửi vào email của bạn.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto request)
        {
            string cacheKey = $"RESET_{request.Email}";

            // 1. Kiểm tra OTP trong cache
            if (!_cache.TryGetValue(cacheKey, out string savedOtp))
            {
                return BadRequest("Mã xác thực đã hết hạn hoặc không tồn tại.");
            }

            if (savedOtp != request.OtpCode)
            {
                return BadRequest("Mã xác thực không đúng.");
            }

            // 2. Lấy user từ DB
            var user = await _context.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return BadRequest("Lỗi người dùng.");

            // 3. Hash mật khẩu mới và cập nhật
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            // Cập nhật ngày sửa đổi (nếu cần)
            user.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            // 4. Xóa OTP sau khi dùng xong
            _cache.Remove(cacheKey);

            return Ok("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.");
        }
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto request)
        {
            // 1. Tìm user trong DB
            var user = await _context.TblUsers.FindAsync(request.UserId);
            if (user == null)
            {
                return BadRequest("Tài khoản không tồn tại.");
            }

            // 2. Kiểm tra mật khẩu cũ có đúng không
            // Sử dụng BCrypt để so sánh mật khẩu nhập vào (request.CurrentPassword) với Hash trong DB
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("Mật khẩu hiện tại không đúng.");
            }

            // 3. Hash mật khẩu mới và cập nhật
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.Now;

            // 4. Lưu thay đổi
            await _context.SaveChangesAsync();

            return Ok("Đổi mật khẩu thành công.");
        }
    }
}