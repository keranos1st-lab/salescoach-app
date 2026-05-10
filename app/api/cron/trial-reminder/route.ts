import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Защита от случайных вызовов
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://saleschek.ru";

  // Триал «заканчивается завтра»: trialEndsAt попадает в окно ~24ч от момента запуска (23–25ч)
  const now = new Date();
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const expiringSubscriptions = await prisma.subscription.findMany({
    where: {
      plan: "TRIAL",
      status: "TRIAL",
      trialEndsAt: {
        gte: in23h,
        lte: in25h,
      },
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
      company: {
        select: {
          name: true,
          users: {
            where: { role: Role.OWNER },
            take: 1,
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const sub of expiringSubscriptions) {
    const recipient = sub.user ?? sub.company?.users[0];
    if (!recipient?.email) continue;

    const userName = recipient.name ?? "пользователь";
    const trialEndsAt = sub.trialEndsAt!;
    const trialDate = trialEndsAt.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });

    try {
      await resend.emails.send({
        from: "SalesCoach <noreply@saleschek.ru>",
        to: recipient.email,
        subject: "Ваш пробный период заканчивается завтра ⏰",
        html: `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:#0d9488;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SalesCoach</h1>
            <p style="margin:8px 0 0;color:#99f6e4;font-size:14px;">Анализ звонков с помощью ИИ</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">
              ${userName}, ваш триал заканчивается ${trialDate} ⏰
            </h2>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Завтра истекает ваш бесплатный пробный период. Чтобы продолжить анализировать звонки и получать рекомендации — выберите подходящий тариф.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin:24px 0;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 8px;color:#c2410c;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Тарифы от</p>
                  <p style="margin:0;color:#9a3412;font-size:22px;font-weight:700;">3 990 ₽/мес</p>
                  <p style="margin:4px 0 0;color:#9a3412;font-size:14px;">До 20 звонков · 1 менеджер · Email-поддержка</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#0d9488;border-radius:10px;text-align:center;">
                  <a href="${appUrl}/pricing" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    Выбрать тариф →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
              Вы получили это письмо потому что зарегистрированы на saleschek.ru<br>
              <a href="${appUrl}/offer" style="color:#0d9488;text-decoration:none;">Публичная оферта</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
      sent++;
    } catch (err) {
      console.error("[trial-reminder] email error", recipient.email, err);
      errors++;
    }
  }

  console.log(`[trial-reminder] sent=${sent} errors=${errors} total=${expiringSubscriptions.length}`);
  return NextResponse.json({ sent, errors, total: expiringSubscriptions.length });
}
