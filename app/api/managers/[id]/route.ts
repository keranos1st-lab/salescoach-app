import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    if (!ctx.user.companyId) {
      return NextResponse.json(
        { error: "К аккаунту не привязана компания" },
        { status: 400 }
      );
    }

    const existing = await prisma.manager.findFirst({
      where: { id, companyId: ctx.user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Менеджер не найден" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
    };

    const name = body.name !== undefined ? body.name.trim() : undefined;
    const email =
      body.email !== undefined ? body.email.trim().toLowerCase() : undefined;

    if (name === undefined && email === undefined) {
      return NextResponse.json(
        { error: "Передайте name и/или email" },
        { status: 400 }
      );
    }

    if (name === "" || email === "") {
      return NextResponse.json(
        { error: "Поля name и email не могут быть пустыми" },
        { status: 400 }
      );
    }

    const updated = await prisma.manager.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    });

    return NextResponse.json({
      manager: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        title: updated.title,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Менеджер с таким email уже существует" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    if (!ctx.user.companyId) {
      return NextResponse.json(
        { error: "К аккаунту не привязана компания" },
        { status: 400 }
      );
    }

    const existing = await prisma.manager.findFirst({
      where: { id, companyId: ctx.user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Менеджер не найден" }, { status: 404 });
    }

    await prisma.manager.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
