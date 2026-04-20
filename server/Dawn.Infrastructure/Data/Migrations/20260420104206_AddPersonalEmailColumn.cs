using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dawn.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalEmailColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PersonalEmail",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PersonalEmail",
                table: "AspNetUsers");
        }
    }
}
