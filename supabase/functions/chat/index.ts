import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const KNOWLEDGE_BASE = `IntelliGrade Course Information
================================

Department: Information Technology (CBIT)
Batches: 2023-2027 and 2024-2028
Sections: IT1, IT2, IT3

Grading Scale (10-point):
- S = 10 (>=90)
- A = 9 (80-89)
- B = 8 (70-79)
- C = 7 (60-69)
- D = 6 (50-59)
- F = 0 (<50)

Theory CIE (max 60):
- Sliptest 1, 2, 3 (5 each) - best 2 of 3 averaged
- Assignment 1, 2 (10 each) - averaged
- Class Test 1, 2 (20 each) - averaged
- Attendance (5)
Total CIE = avg(best 2 sliptests) + avg(assignments) + avg(class tests) + attendance

Practical CIE:
- Weekly CIE (30) - averaged across weeks
- Internal 1, 2 (20 each) - averaged
Total CIE = avg(weekly) + avg(internals)

Each semester gives a student 4-6 theory and 3-4 practical subjects.
Projects and internships are practical subjects.

Tools available: GPA Simulator, Priority Advisor, Study Planner, At-Risk Detection (IntelliGrade risk engine).
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, syllabusContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are IntelliGrade's strict academic teaching assistant for CBIT's Information Technology department.
You ONLY answer questions related to:
- Course syllabus and subjects (use the focused syllabus below as ground truth when provided)
- Academic performance (CIE, SGPA, CGPA, marks, credits, grades)
- Study planning and prioritization
- At-risk detection and intervention
- The IntelliGrade platform features

If the user asks anything unrelated to academics, politely refuse in one short sentence.

${syllabusContext ? `Focused syllabus context (from admin-uploaded regulation):\n${syllabusContext}\n` : ""}
General course context:
${KNOWLEDGE_BASE}

Answer concisely (under 200 words) using markdown when helpful. Cite the unit name when answering syllabus questions.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
