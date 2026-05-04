import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Один вызов getServerSession на RSC-запрос (layout + страницы + шапка). */
export const getCachedSession = cache(() => getServerSession(authOptions));
