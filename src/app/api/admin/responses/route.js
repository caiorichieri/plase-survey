import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getAdminSupabase } from "@/lib/supabase";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-me");

async function verifyAdmin(request) {
  const token = request.cookies.get("plase_admin_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const db = getAdminSupabase();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  const { data, error, count } = await db
    .from("responses")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, pageSize });
}
