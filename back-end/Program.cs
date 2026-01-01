using back_end.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer; // Thêm
using Microsoft.IdentityModel.Tokens; // Thêm
using System.Text; // Thêm
using System.Text.Json.Serialization;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(x =>
{
    // Lệnh này giúp bỏ qua lỗi vòng lặp (A chứa B, B chứa A)
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    x.JsonSerializerOptions.WriteIndented = true;
});
builder.Services.AddOpenApi();

builder.Services.AddDbContext<DbplantShopThuanCuongContext>(options =>
    options.UseSqlServer("Server=DELL;Database=DBPlantShop;Trusted_Connection=True;TrustServerCertificate=True;"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        b => b.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// CẤU HÌNH AUTHENTICATION MỚI
// Giả sử bạn lưu Key trong appsettings.json là "Jwt:Key"
// Nếu không, bạn điền cứng chuỗi key vào đây (như ví dụ trên)
var secretKey = builder.Configuration["AppSettings:Token"] ?? "tokencuavinhthuanvamanhcuong-dsjfhjdfhshfhsfdfhsdfhsdhfsfskhfdjhfkshdfhsdfsdf";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddMemoryCache();
builder.Services.AddScoped<back_end.Services.EmailService>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddHttpClient();

var app = builder.Build();

app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// THỨ TỰ QUAN TRỌNG: Auth -> Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();