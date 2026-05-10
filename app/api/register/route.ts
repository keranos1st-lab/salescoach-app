import { NextResponse } from "next/server";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import { Plan, Role, SubStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
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

    // Отправляем приветственное письмо (не блокируем регистрацию при ошибке)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://saleschek.ru";
      const userName = result.user.name ?? "пользователь";
      const trialEndsAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      const trialDate = trialEndsAt.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });

      await resend.emails.send({
        from: "SalesCoach <noreply@saleschek.ru>",
        to: emailNorm,
        subject: "Добро пожаловать в SalesCoach! 🎉",
        html: `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0d9488;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">SalesCoach</h1>
            <p style="margin:8px 0 0;color:#99f6e4;font-size:14px;">Анализ звонков с помощью ИИ</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:600;">
              Привет, ${userName}! 👋
            </h2>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Спасибо за регистрацию в SalesCoach. Ваш аккаунт успешно создан — вы можете начать анализировать звонки прямо сейчас.
            </p>
            <!-- Trial box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin:24px 0;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 8px;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ваш пробный период</p>
                  <p style="margin:0;color:#166534;font-size:15px;line-height:1.5;">
                    ✅ 4 дня бесплатно<br>
                    ✅ До 20 звонков<br>
                    ✅ До 2 менеджеров<br>
                    📅 Действует до <strong>${trialDate}</strong>
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Загрузите первый звонок и посмотрите как ИИ анализирует работу менеджеров и даёт рекомендации по улучшению продаж.
            </p>
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#0d9488;border-radius:10px;text-align:center;">
                  <a href="${appUrl}/dashboard" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    Открыть дашборд →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
              Если вы не регистрировались на saleschek.ru — просто проигнорируйте это письмо.<br>
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
    } catch (emailError) {
      // Письмо не критично — логируем но не падаем
      console.error("[register] welcome email error", emailError);
    }

    return NextResponse.json({
      success: true,
      userId: result.user.id,
      companyId: result.company.id,
    });
  } catch (error) {
    console.error("[register route error]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
