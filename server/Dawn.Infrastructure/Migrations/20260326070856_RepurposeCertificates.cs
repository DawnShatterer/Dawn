using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dawn.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RepurposeCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IssuedAt",
                table: "Certificates");

            migrationBuilder.RenameColumn(
                name: "CertificateNumber",
                table: "Certificates",
                newName: "Title");

            migrationBuilder.AlterColumn<int>(
                name: "CourseId",
                table: "Certificates",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "FileUrl",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileUrl",
                table: "Certificates");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Certificates",
                newName: "CertificateNumber");

            migrationBuilder.AlterColumn<int>(
                name: "CourseId",
                table: "Certificates",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IssuedAt",
                table: "Certificates",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
