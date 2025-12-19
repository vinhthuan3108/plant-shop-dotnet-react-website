using back_end.DTOs;
using back_end.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Encodings.Web; // <--- Thêm dòng này
using System.Text.Unicode;
// Import namespace models và context của bạn

[Route("api/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class BackupController : ControllerBase
{
    private readonly DbplantShopThuanCuongContext _context;

    public BackupController(DbplantShopThuanCuongContext context)
    {
        _context = context;
    }

    [HttpGet("download-json")]
    public IActionResult DownloadBackup()
    {
        try
        {
            // 1. Lấy dữ liệu từ DB (Nên dùng AsNoTracking để tăng tốc độ)
            var backupData = new BackupDataDto
            {
                BackupTime = DateTime.Now,
                Users = _context.TblUsers.AsNoTracking().ToList(),
                Products = _context.TblProducts.AsNoTracking().ToList(),
                Categories = _context.TblCategories.AsNoTracking().ToList(),
                Orders = _context.TblOrders.AsNoTracking().ToList(),
                OrderDetails = _context.TblOrderDetails.AsNoTracking().ToList(),
                SystemConfigs = _context.TblSystemConfigs.AsNoTracking().ToList()
            };

            // 2. Cấu hình JSON để tránh lỗi Circular Reference (Vòng lặp)
            var options = new JsonSerializerOptions
            {
                WriteIndented = true, // Xuống dòng đẹp
                ReferenceHandler = ReferenceHandler.IgnoreCycles, // Chống lặp vô tận

                // THÊM DÒNG NÀY ĐỂ HIỂN THỊ TIẾNG VIỆT
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };

            // 3. Chuyển object thành chuỗi JSON
            byte[] jsonBytes = JsonSerializer.SerializeToUtf8Bytes(backupData, options);

            // 4. Trả về file
            string fileName = $"Backup_PlantShop_{DateTime.Now:yyyyMMdd_HHmmss}.json";
            return File(jsonBytes, "application/json", fileName);
        }
        catch (Exception ex)
        {
            return BadRequest($"Lỗi sao lưu: {ex.Message}");
        }
    }
}