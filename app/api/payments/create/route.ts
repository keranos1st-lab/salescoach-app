import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHash } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, number> = {
  STARTER: 3990,
  STANDARD: 7990,
  PRO: 14490,
  BUSINESS: 49990,
};

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

    const login = process.env.ROBOKASSA_LOGIN;
    const isTest = process.env.ROBOKASSA_TEST_MODE === "true";
    const password1 = isTest
      ? process.env.ROBOKASSA_TEST_PASSWORD1
      : process.env.ROBOKASSA_PASSWORD1;

    if (!login || !password1) {
      return NextResponse.json({ error: "Платёжный сервис не настроен" }, { status: 500 });
    }

    const amount = PLAN_PRICES[plan].toFixed(2);
    const invId = Date.now(); // уникальный номер заказа

    // Сохраняем платёж в БД
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        yookassaId: String(invId),
        plan: PLAN_TO_PRISMA[plan] as any,
        amount: PLAN_PRICES[plan],
        status: "pending",
      },
    });

    // Подпись: MD5(login:amount:invId:password1:Shp_plan=...:Shp_userId=...)
    const userId = session.user.id;
    const signature = createHash("md5")
      .update(`${login}:${amount}:${invId}:${password1}:Shp_plan=${plan}:Shp_userId=${userId}`)
      .digest("hex");

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://salescoach-app.vercel.app";

    const params = new URLSearchParams({
      MerchantLogin: login,
      OutSum: amount,
      InvId: String(invId),
      Description: `Тариф ${plan} — saleschek.ru`,
      SignatureValue: signature,
      ReturnUrl: `${appUrl}/profile?payment=success`,
      Shp_plan: plan,
      Shp_userId: userId,
      ...(isTest ? { IsTest: "1" } : {}),
    });

    const confirmationUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?${params.toString()}`;

    return NextResponse.json({ confirmationUrl });
  } catch (error) {
    console.error("[payments/create] error", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
