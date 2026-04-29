import { Resend } from "resend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name =
    typeof body?.name === "string" ? body.name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim() : "";
  const message =
    typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "SalesCoach <noreply@saleschek.ru>",
      to: ["info@saleschek.ru"],
      subject: `Обратная связь от ${name}`,
      html: `
        <h2>Новое сообщение с сайта SalesCoach</h2>
        <p><b>Имя:</b> ${escapeHtml(name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Сообщение:</b><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
