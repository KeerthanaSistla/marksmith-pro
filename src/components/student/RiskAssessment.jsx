import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Shield, Brain } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { computeStudentRiskProfile, TIERS } from "@/lib/riskEngine";

const gradeColors = {
  S: "#27AE60", A: "#2980B9", B: "#8E44AD", C: "#E67E22", D: "#95A5A6", F: "#C0392B",
};

const trendIcons = {
  Improving: <TrendingUp className="w-4 h-4 text-accent" />,
  Declining: <TrendingDown className="w-4 h-4 text-destructive" />,
  Stable: <Minus className="w-4 h-4 text-muted-foreground" />,
};

const StudentRiskAssessment = ({ semesterData, grades }) => {
  const profile = useMemo(
    () => computeStudentRiskProfile(semesterData, grades),
    [semesterData, grades]
  );

  if (!profile || profile.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-16 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for risk assessment</p>
        </CardContent>
      </Card>
    );
  }

  // Semester-wise CIE trend
  const semTrend = profile.map(s => ({
    semester: `Sem ${s.semester}`,
    overallPct: s.overallPct,
  }));

  // Current semester predictions
  const currentSem = profile[profile.length - 1];
  const predictions = currentSem?.predictions || [];

  // Overall risk level
  const latestPct = currentSem?.overallPct || 0;
  const riskLevel = latestPct < 40 ? "Critical" : latestPct < 50 ? "High" : latestPct < 60 ? "Moderate" : latestPct < 75 ? "Watch" : null;

  // Subjects at risk
  const atRiskSubjects = predictions.filter(p => p.predictedGrade === "F" || p.predictedGrade === "D");
  const strongSubjects = predictions.filter(p => p.predictedGrade === "S" || p.predictedGrade === "A");

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-5 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Current CIE %</p>
            <p className="text-3xl font-bold text-primary">{latestPct}%</p>
          </CardContent>
        </Card>
        <Card className={`shadow-md ${riskLevel ? "border-destructive/30" : "border-accent/30"}`}>
          <CardContent className="pt-5 text-center">
            {riskLevel ? (
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            ) : (
              <Shield className="w-5 h-5 mx-auto mb-1 text-accent" />
            )}
            <p className="text-xs text-muted-foreground">Risk Level</p>
            {riskLevel ? (
              <Badge className="mt-1" style={{ backgroundColor: TIERS[riskLevel]?.hex, color: "white" }}>{riskLevel}</Badge>
            ) : (
              <Badge className="mt-1 bg-accent text-accent-foreground">Safe</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-5 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-warning" />
            <p className="text-xs text-muted-foreground">At-Risk Subjects</p>
            <p className="text-3xl font-bold text-warning">{atRiskSubjects.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-5 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-xs text-muted-foreground">Strong Subjects</p>
            <p className="text-3xl font-bold text-accent">{strongSubjects.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* CIE Trend Across Semesters */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            CIE Performance Trajectory
          </CardTitle>
          <CardDescription>Semester-wise overall CIE percentage trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={semTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semester" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="overallPct" stroke="hsl(var(--primary))"
                strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 5 }} name="CIE %" />
              {/* Danger zone */}
              <Line type="monotone" dataKey={() => 40} stroke="hsl(var(--destructive))"
                strokeDasharray="5 5" strokeWidth={1} dot={false} name="Fail Threshold" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Predictions */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Grade Predictions — Current Semester</CardTitle>
          <CardDescription>ML-based prediction using CIE component analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictions.map((pred) => {
              const isRisk = pred.predictedGrade === "F" || pred.predictedGrade === "D";
              return (
                <div key={pred.courseCode} className={`p-4 rounded-lg border ${isRisk ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-sm">{pred.courseCode} — {pred.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{pred.type}</Badge>
                          <Badge variant="outline" className="text-xs">{pred.credits} Cr</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Trend */}
                      <div className="flex items-center gap-1 text-xs">
                        {trendIcons[pred.trend]}
                        <span className="text-muted-foreground">{pred.trend}</span>
                      </div>
                      {/* Predicted Grade */}
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Predicted</p>
                        <Badge className="text-base px-3" style={{ backgroundColor: gradeColors[pred.predictedGrade], color: "white" }}>
                          {pred.predictedGrade}
                        </Badge>
                      </div>
                      {/* Actual Grade */}
                      {pred.actualGrade && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Actual</p>
                          <Badge className="text-base px-3" style={{ backgroundColor: gradeColors[pred.actualGrade], color: "white" }}>
                            {pred.actualGrade}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CIE Bar */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground w-16">CIE: {pred.cie}/{pred.maxCIE}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pred.ciePct < 40 ? "bg-destructive" : pred.ciePct < 60 ? "bg-warning" : "bg-accent"}`}
                        style={{ width: `${pred.ciePct}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-20">
                      Confidence: {pred.confidence}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subject CIE Bar Chart */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Subject-wise CIE Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={predictions.map(p => ({
              name: p.courseCode,
              ciePct: p.ciePct,
              fullName: p.name,
            }))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg p-2 text-xs shadow-lg">
                    <p className="font-semibold">{d.fullName}</p>
                    <p>CIE: {d.ciePct}%</p>
                  </div>
                );
              }} />
              <Bar dataKey="ciePct" name="CIE %"
                fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Performance Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={predictions.map(p => ({ subject: p.courseCode, pct: Math.round(p.ciePct) }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" fontSize={10} />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar dataKey="pct" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="CIE %" />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card className="shadow-sm border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Prediction Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>Grade predictions use CIE component analysis with regression-based adjustment for SEE performance correlation.</p>
          <p>Trend analysis examines slip test progression and class test performance to determine trajectory.</p>
          <p>Confidence scores reflect CIE consistency — higher variance = lower confidence.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRiskAssessment;
