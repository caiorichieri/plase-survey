import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminSupabase } from "@/lib/supabase";
import { PLASE_SYSTEM_PROMPT, buildPlaseMessage, parsePlaseOutput } from "@/lib/plase-prompt";

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ["language", "age", "sex", "nationality", "location", "d1", "d2", "d3", "d4", "d5", "d6_scale"];
    for (const field of required) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const db = getAdminSupabase();

    // 1. Insert the raw response first
    const { data: inserted, error: insertError } = await db
      .from("responses")
      .insert({
        language: body.language,
        age: parseInt(body.age),
        sex: body.sex,
        nationality: body.nationality,
        location: body.location,
        d1: body.d1,
        d2: body.d2,
        d3: body.d3,
        d4: body.d4,
        d5: body.d5,
        d6_scale: parseInt(body.d6_scale),
        d6_text: body.d6_text || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const responseId = inserted.id;

    // 2. Run PLASE analysis via Claude API
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const userMessage = buildPlaseMessage(body);

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: PLASE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      const analysisText = message.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const parsed = parsePlaseOutput(analysisText);

      // 3. Update the record with analysis
      await db
        .from("responses")
        .update({
          plase_raw: analysisText,
          plase_analyzed_at: new Date().toISOString(),
          ...parsed,
        })
        .eq("id", responseId);
    } catch (analysisError) {
      // Analysis failed but data is saved — not a fatal error
      console.error("PLASE analysis error:", analysisError);
    }

    return NextResponse.json({ success: true, id: responseId });
  } catch (err) {
    console.error("Submit route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
