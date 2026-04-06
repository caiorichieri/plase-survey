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

export async function PATCH(request, { params }) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();

  const db = getAdminSupabase();
  const updateData = {
    therapist_notes: body.therapist_notes,
    therapist_confirmed: body.therapist_confirmed ?? false,
    therapist_confirmed_at: body.therapist_confirmed ? new Date().toISOString() : null,
  };

  // Optional vector adjustments
  if (body.therapist_adjusted_V !== undefined) updateData.therapist_adjusted_V = body.therapist_adjusted_V;
  if (body.therapist_adjusted_A !== undefined) updateData.therapist_adjusted_A = body.therapist_adjusted_A;
  if (body.therapist_adjusted_phi !== undefined) updateData.therapist_adjusted_phi = body.therapist_adjusted_phi;
  if (body.therapist_adjusted_delta !== undefined) updateData.therapist_adjusted_delta = body.therapist_adjusted_delta;
  if (body.therapist_adjusted_window !== undefined) updateData.therapist_adjusted_window = body.therapist_adjusted_window;
  if (body.therapist_adjusted_stadio !== undefined) updateData.therapist_adjusted_stadio = body.therapist_adjusted_stadio;

  const { error } = await db.from("responses").update(updateData).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
