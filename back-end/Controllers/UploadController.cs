using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;

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

        // URL gọi: POST api/upload/testimonials
        [HttpPost("{type?}")]
        public async Task<IActionResult> Upload(IFormFile file, string type = "images")
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file");

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = Guid.NewGuid().ToString() + fileExtension;

            string subFolder;

            switch (type?.ToLower())
            {
                case "posts":
                    subFolder = "posts";
                    break;
                case "users":
                    subFolder = "users";
                    break;
                case "banners":
                    subFolder = "banners";
                    break;
                case "configs":
                    subFolder = "configs";
                    break;
                case "testimonials": // <--- THÊM MỚI: Lưu ảnh đánh giá vào đây
                    subFolder = "testimonials";
                    break;
                default:
                    subFolder = "images";
                    break;
            }

            var uploadFolder = Path.Combine(_environment.WebRootPath, subFolder);

            // ĐÂY LÀ ĐOẠN TỰ TẠO FOLDER NẾU CHƯA CÓ
            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            var filePath = Path.Combine(uploadFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Trả về: /testimonials/ten-file.jpg
            var url = $"/{subFolder}/{uniqueFileName}";

            return Ok(new { url = url });
        }
    }
}