import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { SubStatus, type Plan } from "@prisma/client";

const PLAN_TO_PRISMA: Record<string, Plan> = {
  STARTER: "START" as Plan,
  STANDARD: "STANDARD" as Plan,
  PRO: "PRO" as Plan,
  BUSINESS: "BUSINESS" as Plan,
};

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const outSum = params.get("OutSum") ?? "";
    const invId = params.get("InvId") ?? "";
    const signatureValue = (params.get("SignatureValue") ?? "").toLowerCase();
    const plan = params.get("Shp_plan") ?? "";
    const userId = params.get("Shp_userId") ?? "";

    const isTest = process.env.ROBOKASSA_TEST_MODE === "true";
    const password2 = (isTest
      ? process.env.ROBOKASSA_TEST_PASSWORD2
      : process.env.ROBOKASSA_PASSWORD2) ?? "";

    // Проверка подписи: MD5(OutSum:InvId:Password2:Shp_plan=...:Shp_userId=...)
    const expected = createHash("md5")
      .update(`${outSum}:${invId}:${password2}:Shp_plan=${plan}:Shp_userId=${userId}`)
      .digest("hex")
      .toLowerCase();

    if (expected !== signatureValue) {
      console.error("[webhook] invalid signature", { expected, signatureValue });
      return new Response("bad sign", { status: 400 });
    }

    const prismaPlan = PLAN_TO_PRISMA[plan];
    if (!prismaPlan) {
      console.error("[webhook] unknown plan", plan);
      return new Response("OK", { status: 200 });
    }

    const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Обновляем статус платежа в БД (InvId сохранён при создании как yookassaId)
    await prisma.payment.update({
      where: { yookassaId: invId },
      data: { status: "succeeded" },
    });

    let companyId: string | null = null;

    if (userId) {
      const updatedOwner = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "active",
          subscriptionEndsAt,
        },
        select: { companyId: true },
      });
      companyId = updatedOwner.companyId ?? null;
    }

    // Подписка компании (модель Subscription: status ACTIVE, срок — currentPeriodEnd)
    if (companyId) {
      await prisma.subscription.update({
        where: { companyId },
        data: {
          plan: prismaPlan,
          status: SubStatus.ACTIVE,
          currentPeriodEnd: subscriptionEndsAt,
          cancelAtPeriodEnd: false,
        },
      });
    }

    // Robokassa ожидает ответ "OK{InvId}"
    return new Response(`OK${invId}`, { status: 200 });
  } catch (error) {
    console.error("[webhook] error", error);
    return new Response("OK", { status: 200 });
  }
}
