import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";

// Маппинг UI-ключей → Prisma enum Plan
const PLAN_TO_PRISMA: Record<string, Plan> = {
  STARTER: "START" as Plan,
  STANDARD: "STANDARD" as Plan,
  PRO: "PRO" as Plan,
  BUSINESS: "BUSINESS" as Plan,
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      event?: string;
      object?: {
        id?: string;
        status?: string;
        metadata?: { userId?: string; plan?: string };
      };
    };

    // Всегда отвечаем 200, чтобы ЮKassa не повторяла запрос
    if (body.event !== "payment.succeeded") {
      return NextResponse.json({ ok: true });
    }

    const { id: yookassaId, metadata, status } = body.object ?? {};
    const { userId, plan } = metadata ?? {};

    if (!userId || !plan || !yookassaId) {
      console.error("[webhook] missing fields", { userId, plan, yookassaId });
      return NextResponse.json({ ok: true });
    }

    const prismaPlan = PLAN_TO_PRISMA[plan];
    if (!prismaPlan) {
      console.error("[webhook] unknown plan", plan);
      return NextResponse.json({ ok: true });
    }

    // Обновляем статус платежа
    await prisma.payment.update({
      where: { yookassaId },
      data: { status: status ?? "succeeded" },
    });

    // Активируем тариф пользователю
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (user?.companyId) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await prisma.subscription.update({
        where: { companyId: user.companyId },
        data: {
          plan: prismaPlan,
          status: "ACTIVE",
          currentPeriodEnd: expiresAt,
          cancelAtPeriodEnd: false,
        },
      });
    }

    console.log("[webhook] subscription updated", { userId, plan, prismaPlan });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] error", error);
    // Важно: возвращаем 200 даже при ошибке, чтобы ЮKassa не спамила повторами
    return NextResponse.json({ ok: true });
  }
}
