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

        // URL sẽ là: api/upload/users
        [HttpPost("{type?}")]
        public async Task<IActionResult> Upload(IFormFile file, string type = "images")
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file");

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = Guid.NewGuid().ToString() + fileExtension;

            // --- CẬP NHẬT LOGIC FOLDER TẠI ĐÂY ---
            string subFolder;
            if (type == "posts")
            {
                subFolder = "posts";
            }
            else if (type == "users") // Thêm dòng này cho Avatar
            {
                subFolder = "users";
            }
            else
            {
                subFolder = "images"; // Mặc định là sản phẩm
            }
            // --------------------------------------

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

            // Trả về đường dẫn tương đối: /users/ten-file.jpg
            var url = $"/{subFolder}/{uniqueFileName}";

            return Ok(new { url = url });
        }
    }
}