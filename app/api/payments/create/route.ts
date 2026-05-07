import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, string> = {
  STARTER: "3990.00",
  STANDARD: "7990.00",
  PRO: "14490.00",
  BUSINESS: "49990.00",
};

// Маппинг UI-ключей → Prisma enum Plan
const PLAN_TO_PRISMA: Record<string, string> = {
  STARTER: "START",
  STANDARD: "STANDARD",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan?: string };

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Неверный тариф" }, { status: 400 });
    }

    const amount = PLAN_PRICES[plan];
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://saleschek.ru";

    if (!shopId || !secretKey) {
      return NextResponse.json({ error: "Платёжный сервис не настроен" }, { status: 500 });
    }

    const idempotenceKey = crypto.randomUUID();

    const ykResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization:
          "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: { value: amount, currency: "RUB" },
        confirmation: {
          type: "redirect",
          return_url: `${appUrl}/profile?payment=success`,
        },
        capture: true,
        description: `Тариф ${plan} — saleschek.ru`,
        metadata: {
          userId: session.user.id,
          plan,
        },
      }),
    });

    const ykData = (await ykResponse.json()) as {
      id?: string;
      confirmation?: { confirmation_url?: string };
      description?: string;
    };

    if (!ykResponse.ok || !ykData.id) {
      console.error("[payments/create] YooKassa error", ykData);
      return NextResponse.json(
        { error: ykData.description ?? "Ошибка платёжного сервиса" },
        { status: 500 }
      );
    }

    // Сохраняем платёж в БД
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        yookassaId: ykData.id,
        plan: PLAN_TO_PRISMA[plan] as any,
        amount: parseFloat(amount),
        status: "pending",
      },
    });

    return NextResponse.json({
      confirmationUrl: ykData.confirmation?.confirmation_url,
    });
  } catch (error) {
    console.error("[payments/create] error", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
