import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script để xóa hoàn toàn STAFF role khỏi database
 * Bao gồm:
 * - Xóa tất cả RolePermission liên quan
 * - Xóa tất cả UserRole liên quan
 * - Xóa STAFF role
 */
async function main() {
  console.log("🧹 Bắt đầu xóa STAFF role khỏi database...\n");

  // Tìm STAFF role
  const staffRole = await prisma.role.findUnique({
    where: { name: "STAFF" },
  });

  if (!staffRole) {
    console.log("✅ STAFF role không tồn tại trong database. Không cần xóa.");
    return;
  }

  console.log(`📋 Tìm thấy STAFF role: ${staffRole.id}`);

  // Đếm số lượng liên kết
  const [rolePermissionCount, userRoleCount] = await Promise.all([
    prisma.rolePermission.count({
      where: { roleId: staffRole.id },
    }),
    prisma.userRole.count({
      where: { roleId: staffRole.id },
    }),
  ]);

  console.log(`\n📊 Thống kê:`);
  console.log(`   - RolePermission: ${rolePermissionCount}`);
  console.log(`   - UserRole: ${userRoleCount}`);

  if (rolePermissionCount > 0 || userRoleCount > 0) {
    console.log(`\n🗑️  Đang xóa các liên kết...`);

    // Xóa RolePermission
    if (rolePermissionCount > 0) {
      const deletedPermissions = await prisma.rolePermission.deleteMany({
        where: { roleId: staffRole.id },
      });
      console.log(`   ✅ Đã xóa ${deletedPermissions.count} RolePermission`);
    }

    // Xóa UserRole
    if (userRoleCount > 0) {
      const deletedUserRoles = await prisma.userRole.deleteMany({
        where: { roleId: staffRole.id },
      });
      console.log(`   ✅ Đã xóa ${deletedUserRoles.count} UserRole`);
    }
  }

  // Xóa STAFF role
  console.log(`\n🗑️  Đang xóa STAFF role...`);
  await prisma.role.delete({
    where: { id: staffRole.id },
  });
  console.log(`   ✅ Đã xóa STAFF role`);

  console.log(`\n🎉 Hoàn tất! STAFF role đã được xóa khỏi database.`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi xóa STAFF role:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
