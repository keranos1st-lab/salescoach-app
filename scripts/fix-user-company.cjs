const { PrismaClient, Plan, SubStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "vizi-stickers@mail.ru";

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: true,
      subscription: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  console.log("[fix-user-company] user:", {
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    hasCompany: !!user.company,
  });

  if (user.companyId) {
    console.log("[fix-user-company] user already linked to company, nothing to do");
    return;
  }

  const relatedManager = await prisma.manager.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
      ],
    },
    include: {
      company: {
        include: {
          subscription: true,
        },
      },
    },
  });

  let companyId;

  if (relatedManager?.companyId) {
    companyId = relatedManager.companyId;
    console.log("[fix-user-company] found related manager/company:", {
      managerId: relatedManager.id,
      managerEmail: relatedManager.email,
      companyId,
      companyName: relatedManager.company?.name,
    });
  } else {
    const company = await prisma.company.create({
      data: {
        name: user.name?.trim() ? `${user.name} — компания` : "Моя компания",
      },
    });

    companyId = company.id;

    await prisma.subscription.create({
      data: {
        companyId,
        plan: Plan.TRIAL,
        status: SubStatus.TRIAL,
        maxManagers: 2,
        maxCalls: 20,
        trialEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("[fix-user-company] created new company + subscription:", {
      companyId,
      companyName: company.name,
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { companyId },
  });

  console.log("[fix-user-company] updated user:", {
    id: updatedUser.id,
    email: updatedUser.email,
    companyId: updatedUser.companyId,
  });
}

main()
  .catch((err) => {
    console.error("[fix-user-company] ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
