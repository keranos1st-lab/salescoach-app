import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase-clerk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    const token = await getToken({
      template: process.env.CLERK_SUPABASE_JWT_TEMPLATE || undefined,
    });

    // Debug лог
    if (token) {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      console.log("=== CLERK JWT DEBUG ===");
      console.log("token exists:", !!token);
      console.log("payload.sub:", payload.sub);
      console.log("payload.role:", payload.role);
      console.log("userId from auth():", userId);
      console.log("======================");
    } else {
      console.log("=== TOKEN IS NULL ===");
    }

    if (!userId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    const body = (await request.json()) as { name?: string };
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Имя менеджера обязательно" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("managers")
      .insert({
        user_id: userId,
        name,
        score_avg: 0,
        calls_count: 0,
      })
      .select("id, name, calls_count, score_avg, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Не удалось создать менеджера" },
        { status: 500 }
      );
    }

    return NextResponse.json({ manager: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Не передан id менеджера" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("managers")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Не удалось удалить менеджера" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
