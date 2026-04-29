import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid user enumeration.
  if (!user) return NextResponse.json({ success: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.passwordResetToken.deleteMany({ where: { email } });
  await prisma.passwordResetToken.create({ data: { email, token, expiresAt } });

  await resend.emails.send({
    from: "SalesCoach <noreply@saleschek.ru>",
    to: [email],
    subject: "Восстановление пароля — SalesCoach",
    html: `
      <h2>Восстановление пароля</h2>
      <p>Вы запросили сброс пароля для аккаунта SalesCoach.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/reset-password?token=${token}" 
         style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Сбросить пароль
      </a></p>
      <p>Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
