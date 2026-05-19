import { getAuthContextLite } from "@/lib/get-auth-context-lite";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const ctx = await getAuthContextLite();
  if (!ctx?.user.companyId) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as {
    excluded?: unknown;
  };

  if (typeof body?.excluded !== "boolean") {
    return NextResponse.json(
      { error: "Укажите excluded: true или false" },
      { status: 400 },
    );
  }

  const existing = await prisma.call.findFirst({
    where: { id, companyId: ctx.user.companyId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Звонок не найден" }, { status: 404 });
  }

  const updated = await prisma.call.update({
    where: { id },
    data: { excluded: body.excluded },
    select: { id: true, excluded: true },
  });

  return NextResponse.json(updated);
}
