import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function managerPublic(m: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    title: m.title,
    isActive: m.isActive,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    const managers = ctx.managers.map(managerPublic);
    return NextResponse.json({ managers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    if (ctx.user.role !== Role.OWNER) {
      return NextResponse.json(
        { error: "Только владелец компании может создавать менеджеров" },
        { status: 403 }
      );
    }

    if (!ctx.user.companyId) {
      return NextResponse.json(
        { error: "К аккаунту не привязана компания" },
        { status: 400 }
      );
    }

    const maxManagers = ctx.subscription?.maxManagers ?? 2;
    if (ctx.managers.length >= maxManagers) {
      return NextResponse.json(
        { error: "Превышен лимит менеджеров по тарифу" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      phone?: string | null;
      title?: string | null;
    };

    const name = body.name?.trim();
    const phone = body.phone?.trim() || null;
    const title = body.title?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { error: "Укажите имя менеджера" },
        { status: 400 }
      );
    }

    const manager = await prisma.manager.create({
      data: {
        name,
        phone,
        title,
        companyId: ctx.user.companyId,
      },
    });

    return NextResponse.json({ manager: managerPublic(manager) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Конфликт уникальности данных" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
