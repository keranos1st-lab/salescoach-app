import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const resetToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expires < new Date()) {
    return NextResponse.json(
      { error: "Ссылка недействительна или истекла" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email: resetToken.identifier },
    data: { passwordHash: hashed },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ success: true });
}
