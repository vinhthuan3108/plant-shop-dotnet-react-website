using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace back_end.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethodToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // CHỈ CHẠY ĐÚNG LỆNH NÀY: Thêm cột PaymentMethod vào bảng TblOrders
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "TblOrders",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Nếu revert thì xóa cột này đi
            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "TblOrders");
        }
    }
}
