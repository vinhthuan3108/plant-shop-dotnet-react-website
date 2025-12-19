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
                new Claim(ClaimTypes.Role, user.RoleId.ToString())
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
    }
}