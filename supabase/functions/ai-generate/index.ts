// IntelliGrade — AI generator for student AI Zone
// Modes: flashcards | notes | mcq | audio
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function systemPromptFor(mode: string, subject: any, unit: string | null) {
  const ctx = `Subject: ${subject?.code} — ${subject?.name}
Type: ${subject?.type === "P" ? "Practical/Lab" : "Theory"}
Credits: ${subject?.credits}
Syllabus units: ${(subject?.units || []).map((u: any, i: number) => `${i + 1}. ${u.title}: ${u.topics?.join(", ")}`).join(" | ")}
${unit ? `Focus on: ${unit}` : ""}`;

  if (mode === "flashcards") {
    return `You generate study flashcards for engineering students. Use the syllabus below as the ground truth.
${ctx}
Return STRICT JSON only — no prose, no markdown fences:
{"flashcards":[{"q":"...","a":"...","unit":"Unit name"}, ...]}
Make exactly 8 cards. Concise questions, accurate 1-3 sentence answers.`;
  }
  if (mode === "notes") {
    return `You write crisp revision notes for engineering students based on the official syllabus.
${ctx}
Return markdown. Structure: brief overview, then bullet points per key topic. Keep under 350 words. End with a 3-line "Quick recap".`;
  }
  if (mode === "mcq") {
    return `You generate single-best-answer MCQs for engineering students. Use the syllabus below.
${ctx}
Return STRICT JSON only:
{"questions":[{"q":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}, ...]}
Make exactly 6 questions, mix of conceptual and applied. answerIndex is 0-3.`;
  }
  if (mode === "audio") {
    return `You write a spoken-word audio overview script for engineering students. Use the syllabus.
${ctx}
Return plain text (no markdown, no stage directions). Conversational, 150-220 words, suitable for text-to-speech. Cover key ideas from the syllabus and end with one motivating line.`;
  }
  return ctx;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { mode, subject, unit } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");

    const system = systemPromptFor(mode, subject, unit);
    const wantsJson = mode === "flashcards" || mode === "mcq";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Generate the ${mode} now.` },
        ],
        ...(wantsJson ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!res.ok) {
      if (res.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit. Please retry shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await res.text();
      console.error("ai-gateway", res.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    let payload: any = { raw };
    if (wantsJson) {
      try { payload = { ...payload, ...JSON.parse(raw) }; }
      catch {
        // try to salvage JSON between first { and last }
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) { try { payload = { ...payload, ...JSON.parse(m[0]) }; } catch {} }
      }
    } else {
      payload.text = raw;
    }

    return new Response(JSON.stringify(payload),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
