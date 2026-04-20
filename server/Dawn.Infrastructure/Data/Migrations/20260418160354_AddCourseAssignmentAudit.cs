using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dawn.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseAssignmentAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CourseAssignmentAudits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    PreviousTeacherId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewTeacherId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AdminUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseAssignmentAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseAssignmentAudits_AspNetUsers_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseAssignmentAudits_AspNetUsers_NewTeacherId",
                        column: x => x.NewTeacherId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseAssignmentAudits_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseAssignmentAudits_AdminUserId",
                table: "CourseAssignmentAudits",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAssignmentAudits_AssignedAt",
                table: "CourseAssignmentAudits",
                column: "AssignedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAssignmentAudits_CourseId",
                table: "CourseAssignmentAudits",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAssignmentAudits_NewTeacherId",
                table: "CourseAssignmentAudits",
                column: "NewTeacherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseAssignmentAudits");
        }
    }
}
