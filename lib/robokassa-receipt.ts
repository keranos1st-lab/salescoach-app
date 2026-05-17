import { createHash } from "crypto";

/** One line item for Robokassa Receipt (ФЗ-54 / Робочеки). */
export type RobokassaReceiptItem = {
  name: string;
  quantity: number;
  sum: number;
  payment_method: "full_payment";
  payment_object: "service";
  /** `none` — без НДС (типично для НПД / самозанятого). */
  tax: "none";
};

export type RobokassaReceiptPayload = {
  items: RobokassaReceiptItem[];
  /** Optional; omit if tax system is fixed in Robokassa merchant / Робочеки cabinet. */
  sno?: string;
};

const RECEIPT_PLAN_KEYS = ["STARTER", "STANDARD", "PRO", "BUSINESS"] as const;
export type RobokassaPaidPlanKey = (typeof RECEIPT_PLAN_KEYS)[number];

export function isRobokassaPaidPlan(plan: string): plan is RobokassaPaidPlanKey {
  return (RECEIPT_PLAN_KEYS as readonly string[]).includes(plan);
}

/** Minified JSON for SignatureValue (not URL-encoded). */
export function buildRobokassaReceiptJson(
  plan: RobokassaPaidPlanKey,
  amount: number,
): string {
  const payload: RobokassaReceiptPayload = {
    items: [
      {
        name: `Подписка SalesCoach — тариф ${plan}`,
        quantity: 1,
        sum: amount,
        payment_method: "full_payment",
        payment_object: "service",
        tax: "none",
      },
    ],
  };

  const sno = process.env.ROBOKASSA_RECEIPT_SNO?.trim();
  if (sno) {
    payload.sno = sno;
  }

  return JSON.stringify(payload);
}

/**
 * Payment request signature with Receipt (Password #1).
 * @see https://docs.robokassa.com/ru/pay-interface — MerchantLogin:OutSum:InvId:Receipt:Пароль#1:Shp_*
 */
export function buildRobokassaPaymentSignature(params: {
  merchantLogin: string;
  outSum: string;
  invId: string | number;
  receiptJson: string;
  password1: string;
  shp: Record<string, string>;
}): string {
  const shpSuffix = Object.keys(params.shp)
    .sort()
    .map((key) => `${key}=${params.shp[key]}`)
    .join(":");

  const signatureString = shpSuffix
    ? `${params.merchantLogin}:${params.outSum}:${params.invId}:${params.receiptJson}:${params.password1}:${shpSuffix}`
    : `${params.merchantLogin}:${params.outSum}:${params.invId}:${params.receiptJson}:${params.password1}`;

  return createHash("md5").update(signatureString).digest("hex");
}
