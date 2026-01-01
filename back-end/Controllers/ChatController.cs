using back_end.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace back_end.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public ChatController(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskAI([FromBody] ChatRequestDto request)
        {
            // 1. Kiểm tra đầu vào
            if (string.IsNullOrEmpty(request.Message))
                return BadRequest("Vui lòng nhập câu hỏi.");

            // 2. Lấy API Key từ cấu hình
            var apiKey = _configuration["AISettings:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, "Chưa cấu hình API Key trên Server.");

            // 3. Chuẩn bị câu lệnh (Prompt) cho AI
            // Bạn có thể sửa "systemPrompt" để bot đóng vai theo ý muốn
            var systemPrompt = "Bạn là trợ lý ảo chăm sóc khách hàng của Shop Cây Cảnh. Hãy trả lời ngắn gọn, thân thiện và dùng icon cây cối.";
            var fullMessage = $"{systemPrompt}\nKhách hỏi: {request.Message}";

            // 4. Cấu trúc dữ liệu gửi sang Google Gemini
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = fullMessage }
                        }
                    }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            // 5. URL gọi API Gemini (Dùng bản 1.5 Flash cho nhanh)
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

            try
            {
                // 6. Gửi Request
                var response = await _httpClient.PostAsync(url, jsonContent);

                if (!response.IsSuccessStatusCode)
                {
                    var errorDetail = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, $"Lỗi từ Google: {errorDetail}");
                }

                // 7. Xử lý kết quả trả về
                var jsonResponse = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonResponse);

                // Gemini trả về JSON khá sâu, cần lấy đúng chỗ
                var reply = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return Ok(new ChatResponseDto { Reply = reply });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi hệ thống: " + ex.Message);
            }
        }
    }
}