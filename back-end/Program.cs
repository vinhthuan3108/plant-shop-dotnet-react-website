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

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<DbplantShopThuanCuongContext>(options =>
    options.UseSqlServer(connectionString));


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        b => b.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://ntuvinhthuan.id.vn",              // Domain 
                "https://dreamy-vacherin-ac9338.netlify.app/" // Domain gốc Netlify
             )
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var secretKey = builder.Configuration["AppSettings:Token"];

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


app.UseCors("AllowReactApp");


app.MapOpenApi();


app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();