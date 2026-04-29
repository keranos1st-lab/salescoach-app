import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Ссылка недействительна или истекла" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email: resetToken.email },
    data: { password: hashed },
  });
  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ success: true });
}
