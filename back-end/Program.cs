using back_end.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddDbContext<DbplantShopThuanCuongContext>(options =>
    options.UseSqlServer("Server=DELL;Database=DBPlantShopThuanCuong;Trusted_Connection=True;TrustServerCertificate=True;"));

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

app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.Run();