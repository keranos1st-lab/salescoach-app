import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Plan, Role, SubStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }

  const emailNorm = String(email).trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    return NextResponse.json(
      { error: "Email уже зарегистрирован" },
      { status: 400 }
    );
  }

  const managerEmailTaken = await prisma.manager.findUnique({
    where: { email: emailNorm },
  });
  if (managerEmailTaken) {
    return NextResponse.json(
      { error: "Email уже используется" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: "Моя компания" },
    });
    const user = await tx.user.create({
      data: {
        email: emailNorm,
        name: name?.trim() || null,
        passwordHash: hashed,
        role: Role.OWNER,
        companyId: company.id,
      },
    });
    const subscription = await tx.subscription.create({
      data: {
        companyId: company.id,
        plan: Plan.TRIAL,
        status: SubStatus.TRIAL,
        maxManagers: 2,
        maxCalls: 20,
        trialEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    });
    return { user, company, subscription };
  });

  return NextResponse.json({
    success: true,
    userId: result.user.id,
    companyId: result.company.id,
  });
}
