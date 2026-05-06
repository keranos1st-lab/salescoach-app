import { NextResponse } from "next/server";
import { Plan, SubStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: null },
    });

    const fixed: Array<{ email: string; userId: string; companyId: string }> = [];

    for (const user of users) {
      const company = await prisma.company.create({
        data: {
          name: user.name?.trim() ? `${user.name} — компания` : `Компания ${user.email}`,
        },
      });

      await prisma.subscription.create({
        data: {
          plan: Plan.TRIAL,
          status: SubStatus.TRIAL,
          maxManagers: 2,
          maxCalls: 20,
          trialEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          companyId: company.id,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: company.id },
      });

      fixed.push({
        email: user.email,
        userId: user.id,
        companyId: company.id,
      });
    }

    return NextResponse.json({
      success: true,
      fixed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
