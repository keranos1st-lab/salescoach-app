import { createClient } from "@/lib/supabase-server";
import { getUserIdFromRequest } from "@/lib/request-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    const supabase = await createClient();

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
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
    }

    const supabase = await createClient();

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
