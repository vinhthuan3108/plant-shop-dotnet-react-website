using back_end.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- 1. THÊM DÒNG NÀY (Để hệ thống nhận diện các Controller trong thư mục Controllers) ---
builder.Services.AddControllers();
// ----------------------------------------------------------------------------------------

builder.Services.AddOpenApi();
builder.Services.AddDbContext<DbplantShopThuanCuongContext>(options =>
    options.UseSqlServer("Server=LAPTOP-BPFVN8L7\\SQLEXPRESS02;Database=DBPlantShopThuanCuong;Trusted_Connection=True;TrustServerCertificate=True;"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder.WithOrigins("http://localhost:3000", "http://localhost:5173")
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization(); // (Có thể thêm dòng này cho đầy đủ quy trình, dù chưa dùng login)

// --- 2. THÊM DÒNG NÀY (Để hệ thống định tuyến các API trong Controller) ---
app.MapControllers();


app.Run();

