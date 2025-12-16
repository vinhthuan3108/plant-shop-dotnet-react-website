using back_end.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký dịch vụ Controllers
builder.Services.AddControllers();

builder.Services.AddOpenApi();

// Cấu hình Database
builder.Services.AddDbContext<DbplantShopThuanCuongContext>(options =>
    options.UseSqlServer("Server=LAPTOP-BPFVN8L7\\SQLEXPRESS02;Database=DBPlantShopThuanCuong;Trusted_Connection=True;TrustServerCertificate=True;"));

// Cấu hình CORS (Cho phép React truy cập)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder.WithOrigins("http://localhost:3000", "http://localhost:5173") // Port React của bạn
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});
builder.Services.AddAuthentication().AddJwtBearer();
var app = builder.Build();

// --- BẮT ĐẦU PIPELINE ---

// 2. Kích hoạt CORS đầu tiên
app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// 3. Kích hoạt File tĩnh (QUAN TRỌNG: Đặt ở đây)
// Nó giúp hiển thị ảnh từ thư mục wwwroot ra trình duyệt
app.UseStaticFiles();

app.UseAuthorization();

// 4. Định tuyến Controller (Thường đặt cuối cùng)
app.MapControllers();

app.Run();