import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, TrendingUp, Target, BookOpen, Lightbulb } from "lucide-react";
import {
  computeStudentRiskProfile, CATEGORIES,
  AT_RISK_AVG_PCT, CRITICAL_AVG_PCT, FAIL_PCT,
} from "@/lib/riskEngine";
import { getSyllabusUnits } from "@/lib/dataStore";

const gradeColors = {
  S: "#16A34A", A: "#2563EB", B: "#7C3AED", C: "#F59E0B", D: "#94A3B8", F: "#DC2626",
};

// Weak units heuristic: when subject CIE % < 60, surface the first 2 units as
// areas to revisit (RAG over real notes will refine this later).
const weakUnitsFor = (subjectCode, ciePct) => {
  if (ciePct >= 60) return [];
  const units = getSyllabusUnits(subjectCode);
  return units.slice(0, ciePct < 40 ? 3 : 2);
};

const MarksInsights = ({ semesterData, grades }) => {
  const profile = useMemo(() => computeStudentRiskProfile(semesterData, grades), [semesterData, grades]);
  if (!profile || profile.length === 0) return null;

  const current = profile[profile.length - 1];
  const preds = current.predictions || [];
  const failCount = preds.filter((p) => p.ciePct < FAIL_PCT).length;
  const overallPct = current.overallPct;

  let category;
  if (overallPct < CRITICAL_AVG_PCT || failCount >= 2) category = "Critical";
  else if (overallPct < AT_RISK_AVG_PCT || failCount >= 1) category = "At Risk";
  else category = "Safe";
  const meta = CATEGORIES[category];

  // Two pragmatic actions based on category
  const actions = (() => {
    if (category === "Critical") return [
      "Meet your faculty advisor this week — agree on a recovery plan.",
      `Prioritise the ${failCount} failing subject${failCount !== 1 ? "s" : ""} — revise weak units flagged below.`,
    ];
    if (category === "At Risk") return [
      "Focus extra time on subjects below 60% — start with the weakest first.",
      "Use the AI Zone (flashcards + notes) to drill the flagged units before the next class test.",
    ];
    return [
      "Keep up the consistent attendance and assignment submissions.",
      "Stretch goal: aim for an S in your strongest subject this semester.",
    ];
  })();

  return (
    <Card className="shadow-md border-2" style={{ borderColor: `${meta.hex}55` }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {category === "Safe"
                ? <Shield className="w-5 h-5 text-accent" />
                : <AlertTriangle className="w-5 h-5" style={{ color: meta.hex }} />}
              Your status
              <Badge className="ml-1" style={{ backgroundColor: meta.hex, color: "white" }}>{category}</Badge>
            </CardTitle>
            <CardDescription>
              Credit-weighted CIE: <strong>{overallPct}%</strong> · Subjects failing CIE: <strong>{failCount}</strong>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Lightbulb className="w-4 h-4 mt-0.5 text-warning shrink-0" />
              <span>{a}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Predicted SEE grade & weak units (current semester)
          </p>
          <div className="space-y-2">
            {preds.map((p) => {
              const weak = weakUnitsFor(p.courseCode, p.ciePct);
              const barColor = p.ciePct < FAIL_PCT ? "bg-destructive" :
                               p.ciePct < AT_RISK_AVG_PCT ? "bg-warning" :
                               p.ciePct < 75 ? "bg-info" : "bg-accent";
              return (
                <div key={p.courseCode} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <span className="font-mono text-xs text-muted-foreground mr-2">{p.courseCode}</span>
                        {p.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">{p.cie}/{p.maxCIE} ({p.ciePct}%)</span>
                      <Badge className="text-xs px-2" style={{ backgroundColor: gradeColors[p.predictedGrade], color: "white" }}>
                        {p.predictedGrade}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, p.ciePct)}%` }} />
                  </div>
                  {weak.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Revise:</span>
                      {weak.map((u, i) => (
                        <Badge key={i} variant="outline" className="text-[11px] font-normal gap-1">
                          <BookOpen className="w-2.5 h-2.5" />
                          {u.title.replace(/^Unit [IVX]+ — /, "")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarksInsights;
