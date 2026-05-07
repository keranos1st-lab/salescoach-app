import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { name?: string };
  const name = body.name;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name?.trim() || null },
  });

  return NextResponse.json({ success: true });
}
