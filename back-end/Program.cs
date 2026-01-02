using back_end.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(x =>
{
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    x.JsonSerializerOptions.WriteIndented = true;
});
builder.Services.AddOpenApi();

// --- SỬA ĐỔI 1: Đọc Connection String từ appsettings.json ---
// Thay vì viết cứng, ta lấy từ file cấu hình.
// Lưu ý: Key "DefaultConnection" phải khớp với file appsettings.json bạn vừa sửa.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<DbplantShopThuanCuongContext>(options =>
    options.UseSqlServer(connectionString));

// --- SỬA ĐỔI 2: Cấu hình CORS cho Netlify ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        b => b.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://ntuvinhthuan.id.vn",              // Domain chính của bạn
                "https://dreamy-vacherin-ac9338.netlify.app/" // Domain gốc Netlify (đề phòng)
             )
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// CẤU HÌNH AUTHENTICATION
var secretKey = builder.Configuration["AppSettings:Token"];
// Kiểm tra nếu chưa cấu hình Token thì báo lỗi hoặc gán giá trị mặc định để debug
if (string.IsNullOrEmpty(secretKey))
{
    secretKey = "Dung_Quen_Cau_Hinh_Token_Trong_AppSettings_Nhe";
}

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
builder.Services.AddScoped<back_end.Services.IShippingCalculatorService, back_end.Services.ShippingCalculatorService>();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Sử dụng Policy CORS đã định nghĩa ở trên
app.UseCors("AllowReactApp");

// Mở Swagger kể cả trên Production để dễ test (Tùy chọn, SmarterASP đôi khi cần cái này để check)

app.MapOpenApi();


app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();