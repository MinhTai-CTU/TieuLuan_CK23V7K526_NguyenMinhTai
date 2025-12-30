import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "minhtai2019cb2@gmail.com";

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ User with email ${email} not found!`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);

  // Find ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
  });

  if (!adminRole) {
    console.error("❌ ADMIN role not found!");
    process.exit(1);
  }

  console.log(`✅ Found role: ADMIN (${adminRole.id})`);

  // Check existing roles
  const existingRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });

  console.log(
    `📋 Current roles: ${existingRoles.map((ur) => ur.role.name).join(", ") || "None"}`
  );

  // Assign ADMIN role
  const adminUserRole = await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id,
    },
  });

  console.log(`✅ Assigned ADMIN role`);

  // Verify
  const finalRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });

  console.log(
    `\n🎉 Success! User now has roles: ${finalRoles.map((ur) => ur.role.name).join(", ")}`
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
