using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dawn.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveB2CLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRecords_Courses_CourseId",
                table: "PaymentRecords");

            migrationBuilder.DropTable(
                name: "CourseCoupons");

            migrationBuilder.DropIndex(
                name: "IX_PaymentRecords_CourseId",
                table: "PaymentRecords");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "PaymentRecords");

            migrationBuilder.DropColumn(
                name: "InstructorEarning",
                table: "PaymentRecords");

            migrationBuilder.DropColumn(
                name: "PlatformCommission",
                table: "PaymentRecords");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Courses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "PaymentRecords",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "InstructorEarning",
                table: "PaymentRecords",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformCommission",
                table: "PaymentRecords",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Courses",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "CourseCoupons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OwnerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsedOnCourseId = table.Column<int>(type: "int", nullable: true),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiscountPercent = table.Column<int>(type: "int", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    MaxDiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseCoupons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseCoupons_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseCoupons_Courses_UsedOnCourseId",
                        column: x => x.UsedOnCourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRecords_CourseId",
                table: "PaymentRecords",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseCoupons_Code",
                table: "CourseCoupons",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseCoupons_OwnerId",
                table: "CourseCoupons",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseCoupons_UsedOnCourseId",
                table: "CourseCoupons",
                column: "UsedOnCourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRecords_Courses_CourseId",
                table: "PaymentRecords",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
