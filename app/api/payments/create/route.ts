import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildRobokassaPaymentSignature,
  buildRobokassaReceiptJson,
  isRobokassaPaidPlan,
} from "@/lib/robokassa-receipt";

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
    console.log("[payments/create] session", JSON.stringify(session));
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan?: string };
    if (!plan || !PLAN_PRICES[plan] || !isRobokassaPaidPlan(plan)) {
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

    const amountNumber = PLAN_PRICES[plan];
    const amount = amountNumber.toFixed(2);
    const invId = Date.now();

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        yookassaId: String(invId),
        plan: PLAN_TO_PRISMA[plan] as Plan,
        amount: amountNumber,
        status: "pending",
      },
    });

    const userId = session.user.id;
    const receiptJson = buildRobokassaReceiptJson(plan, amountNumber);

    const signature = buildRobokassaPaymentSignature({
      merchantLogin: login,
      outSum: amount,
      invId,
      receiptJson,
      password1,
      shp: {
        Shp_plan: plan,
        Shp_userId: userId,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://salescoach-app.vercel.app";

    const params = new URLSearchParams({
      MerchantLogin: login,
      OutSum: amount,
      InvId: String(invId),
      Description: `Подписка SalesCoach — тариф ${plan}`,
      Receipt: receiptJson,
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
