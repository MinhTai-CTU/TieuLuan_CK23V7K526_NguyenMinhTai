import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking permissions for STAFF role...\n");

  // Find STAFF role
  const staffRole = await prisma.role.findUnique({
    where: { name: "STAFF" },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!staffRole) {
    console.error("❌ STAFF role not found!");
    return;
  }

  console.log(`✅ Found STAFF role: ${staffRole.id}`);
  console.log(`📋 Permissions (${staffRole.rolePermissions.length}):`);
  staffRole.rolePermissions.forEach((rp) => {
    console.log(`   - ${rp.permission.name}`);
  });

  // Check if categories.manage exists
  const categoriesManage = await prisma.permission.findUnique({
    where: { name: "categories.manage" },
  });

  if (!categoriesManage) {
    console.log("\n❌ Permission 'categories.manage' not found!");
    console.log("💡 Run 'npm run seed' to create permissions.");
    return;
  }

  console.log(
    `\n✅ Permission 'categories.manage' exists: ${categoriesManage.id}`
  );

  // Check if STAFF has this permission
  const hasPermission = staffRole.rolePermissions.some(
    (rp) => rp.permission.name === "categories.manage"
  );

  if (!hasPermission) {
    console.log(
      "\n⚠️  STAFF role does NOT have 'categories.manage' permission!"
    );
    console.log("🔧 Assigning permission...");

    await prisma.rolePermission.create({
      data: {
        roleId: staffRole.id,
        permissionId: categoriesManage.id,
      },
    });

    console.log("✅ Permission assigned successfully!");
  } else {
    console.log("\n✅ STAFF role already has 'categories.manage' permission!");
  }

  // Check a specific user
  const email = process.argv[2] || "minhtai2019cb2@gmail.com";
  console.log(`\n👤 Checking user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.log(`❌ User not found: ${email}`);
    return;
  }

  console.log(`✅ Found user: ${user.name || user.email}`);
  console.log(
    `📋 Roles: ${user.userRoles.map((ur) => ur.role.name).join(", ")}`
  );

  const allPermissions = new Set<string>();
  user.userRoles.forEach((ur) => {
    ur.role.rolePermissions.forEach((rp) => {
      allPermissions.add(rp.permission.name);
    });
  });

  console.log(`\n📋 All permissions (${allPermissions.size}):`);
  Array.from(allPermissions)
    .sort()
    .forEach((perm) => {
      console.log(`   - ${perm}`);
    });

  const hasCategoriesManage = allPermissions.has("categories.manage");
  console.log(
    `\n${hasCategoriesManage ? "✅" : "❌"} User has 'categories.manage': ${hasCategoriesManage}`
  );
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
