import type { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanKey } from "@/lib/plans";
import { SubStatus, type Plan } from "@prisma/client";

const PLAN_TO_PRISMA: Record<string, Plan> = {
  STARTER: "START" as Plan,
  STANDARD: "STANDARD" as Plan,
  PRO: "PRO" as Plan,
  BUSINESS: "BUSINESS" as Plan,
};

export async function POST(req: NextRequest) {
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
    console.error("[webhook] unknown plan", { plan, invId, outSum, userId });
    return new Response("unknown plan", { status: 400 });
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { yookassaId: invId },
  });

  if (existingPayment?.status === "succeeded") {
    return new Response(`OK${invId}`, { status: 200 });
  }

  const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const paidPlanKey = plan as PlanKey;
  const planLimits = PLANS[paidPlanKey];

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { yookassaId: invId },
      data: { status: "succeeded" },
    });

    let companyId: string | null = null;

    if (userId) {
      const updatedOwner = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "active",
          subscriptionEndsAt,
        },
        select: { companyId: true },
      });
      companyId = updatedOwner.companyId ?? null;
    }

    if (companyId) {
      await tx.subscription.update({
        where: { companyId },
        data: {
          plan: prismaPlan,
          status: SubStatus.ACTIVE,
          currentPeriodEnd: subscriptionEndsAt,
          cancelAtPeriodEnd: false,
          maxManagers: planLimits.maxManagers,
          maxCalls:
            (planLimits.maxCalls ?? null) === null
              ? Number.MAX_SAFE_INTEGER
              : (planLimits.maxCalls as number),
        },
      });
    }
  });

  return new Response(`OK${invId}`, { status: 200 });
}
