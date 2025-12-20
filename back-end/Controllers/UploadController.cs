using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        public UploadController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        // URL gọi API: 
        // 1. Upload sản phẩm: POST api/upload/images (hoặc không truyền type)
        // 2. Upload bài viết: POST api/upload/posts
        // 3. Upload user:     POST api/upload/users
        // 4. Upload banner:   POST api/upload/banners  <-- MỚI
        [HttpPost("{type?}")]
        public async Task<IActionResult> Upload(IFormFile file, string type = "images")
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file");

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = Guid.NewGuid().ToString() + fileExtension;

            // --- CẬP NHẬT LOGIC FOLDER TẠI ĐÂY ---
            string subFolder;
            
            // Dùng hàm ToLower() để tránh lỗi nếu lỡ nhập chữ hoa (Ví dụ: Banners)
            switch (type.ToLower()) 
            {
                case "posts":
                    subFolder = "posts";
                    break;
                case "users":
                    subFolder = "users";
                    break;
                case "banners": // <-- Đã thêm phần này cho bạn
                    subFolder = "banners";
                    break;
                default:
                    subFolder = "images"; // Mặc định là thư mục chứa ảnh sản phẩm
                    break;
            }
            // --------------------------------------

            var uploadFolder = Path.Combine(_environment.WebRootPath, subFolder);

            // Tự động tạo thư mục nếu chưa có
            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            var filePath = Path.Combine(uploadFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Trả về đường dẫn tương đối: /banners/ten-file-ngau-nhien.jpg
            var url = $"/{subFolder}/{uniqueFileName}";

            return Ok(new { url = url });
        }
    }
}