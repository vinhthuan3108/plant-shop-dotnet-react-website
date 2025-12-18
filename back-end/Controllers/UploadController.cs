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

        [HttpPost("{type?}")] // Thêm tham số type (optional)
        public async Task<IActionResult> Upload(IFormFile file, string type = "images")
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file");

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = Guid.NewGuid().ToString() + fileExtension;

            // Nếu type là "posts" thì vào wwwroot/posts, ngược lại mặc định vào wwwroot/images
            var subFolder = type == "posts" ? "posts" : "images";
            var uploadFolder = Path.Combine(_environment.WebRootPath, subFolder);

            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            var filePath = Path.Combine(uploadFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Trả về URL đúng thư mục
            var url = $"/{subFolder}/{uniqueFileName}";

            return Ok(new { url = url });
        }
    }
}