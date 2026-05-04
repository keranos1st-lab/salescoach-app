import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    console.log("[forgot-password] запрос для email:", email);
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("[forgot-password] пользователь найден:", !!user);

    // Always return success to avoid user enumeration.
    if (!user) return NextResponse.json({ success: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: expiresAt },
    });

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY is missing" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "noreply@saleschek.ru",
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

    console.log("[forgot-password] ответ Resend:", JSON.stringify(result));

    if (result.error) {
      console.error("[forgot-password] Resend error:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log("[forgot-password] письмо отправлено, ID:", result.data?.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password] ОШИБКА:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
