using back_end.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký dịch vụ Controllers
builder.Services.AddControllers();

builder.Services.AddOpenApi();

// Cấu hình Database
builder.Services.AddDbContext<DbplantShopThuanCuongContext>(options =>
    options.UseSqlServer("Server=DELL;Database=DBPlantShopThuanCuong;Trusted_Connection=True;TrustServerCertificate=True;"));

// Cấu hình CORS (Cho phép React truy cập)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder.WithOrigins("http://localhost:3000", "http://localhost:5173") // Port React 
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});
builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<back_end.Services.EmailService>();
var app = builder.Build();



// 2. Kích hoạt CORS đầu tiên
app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();

// 3. Kích hoạt File tĩnh (QUAN TRỌNG: Đặt ở đây)
// Nó giúp hiển thị ảnh từ thư mục wwwroot ra trình duyệt
app.UseStaticFiles();

app.UseAuthorization();

// 4. Định tuyến Controller (Thường đặt cuối cùng)
app.MapControllers();

app.Run();