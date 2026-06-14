import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Shield, Users, TrendingDown, Eye, ChevronRight, Activity, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line,
} from "recharts";
import {
  computeRiskScores, CATEGORIES, CATEGORY_ORDER, predictPerformance,
  FAIL_PCT, CRITICAL_AVG_PCT, AT_RISK_AVG_PCT,
} from "@/lib/riskEngine";
import { buildClassRiskData, DEFAULT_FACULTY_ID } from "@/lib/dataStore";

const CATEGORY_BADGE_CLASSES = {
  Critical:  "bg-destructive text-destructive-foreground",
  "At Risk": "bg-warning text-warning-foreground",
  Safe:      "bg-accent text-accent-foreground",
};

function getMaxCIE(type) { return type === "theory" ? 40 : 50; }

const RiskAssessment = ({ facultyId = DEFAULT_FACULTY_ID }) => {
  const [drillStudent, setDrillStudent] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const classStudents = useMemo(() => buildClassRiskData(facultyId), [facultyId]);
  const { allStudents, subjectStats, summary } = useMemo(
    () => computeRiskScores(classStudents),
    [classStudents],
  );

  const visibleStudents = useMemo(() => {
    if (activeCategory === "All") return allStudents;
    return allStudents.filter((s) => s.category === activeCategory);
  }, [allStudents, activeCategory]);

  // Pie data — Safe / At Risk / Critical
  const categoryPie = CATEGORY_ORDER
    .filter((c) => summary.categories[c] > 0)
    .map((c) => ({ name: c, value: summary.categories[c], color: CATEGORIES[c].hex }));

  // Subject failure data
  const subjectFailData = subjectStats.slice(0, 10).map((s) => ({
    name: s.name.length > 18 ? s.name.substring(0, 18) + "…" : s.name,
    failures: s.failures,
    passRate: s.passRate,
    fullName: s.name,
  }));

  // Predicted-grade distribution across the whole class (from CIE)
  const gradeDist = useMemo(() => {
    const buckets = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    allStudents.forEach((st) => {
      Object.values(st.subjectCIEs).forEach(({ pct }) => {
        const predicted = pct * 0.85 + 15;
        if (predicted >= 90) buckets.S++;
        else if (predicted >= 80) buckets.A++;
        else if (predicted >= 70) buckets.B++;
        else if (predicted >= 60) buckets.C++;
        else if (predicted >= 50) buckets.D++;
        else buckets.F++;
      });
    });
    const colors = { S: "#16A34A", A: "#2563EB", B: "#7C3AED", C: "#F59E0B", D: "#94A3B8", F: "#DC2626" };
    return Object.entries(buckets).map(([grade, count]) => ({ grade, count, color: colors[grade] }));
  }, [allStudents]);

  // Class average CIE % across taught subjects (sorted by code)
  const subjectAvgData = subjectStats
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((s) => ({ name: s.code, avg: s.classMeanPct, fullName: s.name }));

  const safePct = summary.total ? Math.round((summary.safe / summary.total) * 100) : 0;
  const atRiskPct = summary.total ? Math.round((summary.atRisk / summary.total) * 100) : 0;
  const criticalPct = summary.total ? Math.round((summary.critical / summary.total) * 100) : 0;

  if (summary.total === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No teaching assignments found. Add a teaching assignment to see risk analytics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary — 4 cards using the standardised vocabulary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-5 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Students</p>
            <p className="text-3xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-accent/40">
          <CardContent className="pt-5 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Safe</p>
            <p className="text-3xl font-bold text-accent">{summary.safe}</p>
            <p className="text-xs text-muted-foreground">{safePct}% of class</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-warning/40">
          <CardContent className="pt-5 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-warning" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">At Risk</p>
            <p className="text-3xl font-bold text-warning">{summary.atRisk}</p>
            <p className="text-xs text-muted-foreground">{atRiskPct}% • this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-destructive/40">
          <CardContent className="pt-5 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
            <p className="text-3xl font-bold text-destructive">{summary.critical}</p>
            <p className="text-xs text-muted-foreground">{criticalPct}% • immediate</p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown + subject failures */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Class Health Distribution</CardTitle>
            <CardDescription>Standardised — Safe • At Risk • Critical</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryPie} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                  dataKey="value" nameKey="name"
                  label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} students`, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Subject Failure Counts
            </CardTitle>
            <CardDescription>Students scoring below {FAIL_PCT}% CIE</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectFailData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" fontSize={10} width={130} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-2 text-xs shadow-lg">
                        <p className="font-semibold">{d.fullName}</p>
                        <p>Failures: {d.failures} • Pass rate: {d.passRate}%</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="failures" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grade distribution (predicted) + class average by subject */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Predicted Grade Distribution
            </CardTitle>
            <CardDescription>From current CIE across all taught subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={gradeDist}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="grade" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeDist.map((d) => <Cell key={d.grade} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Class Average CIE — by subject
            </CardTitle>
            <CardDescription>Average CIE % per subject (0-100)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={subjectAvgData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-2 text-xs shadow-lg">
                      <p className="font-semibold">{d.fullName}</p>
                      <p>Class avg: {d.avg}%</p>
                    </div>
                  );
                }} />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>


      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Student Roster
              </CardTitle>
              <CardDescription>Double-click a student for detailed analysis</CardDescription>
            </div>
            <div className="flex gap-1 flex-wrap">
              {["All", ...CATEGORY_ORDER].map((c) => {
                const count = c === "All" ? summary.total : summary.categories[c];
                const active = activeCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    }`}
                  >
                    {c} <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 grid grid-cols-12 gap-2 text-xs font-semibold">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Roll No</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1 text-right">Avg %</div>
              <div className="col-span-1 text-right">Fails</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            <div className="divide-y max-h-[420px] overflow-y-auto">
              {visibleStudents.map((student, i) => (
                <div
                  key={student.id}
                  className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                  onDoubleClick={() => setDrillStudent(student)}
                >
                  <div className="col-span-1 text-muted-foreground">{i + 1}</div>
                  <div className="col-span-3 font-mono text-xs">{student.rollNo}</div>
                  <div className="col-span-3 font-medium truncate">{student.name}</div>
                  <div className="col-span-2">
                    <Badge className={`text-xs ${CATEGORY_BADGE_CLASSES[student.category]}`}>
                      {student.category}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-right tabular-nums">{student.avgPct}%</div>
                  <div className={`col-span-1 text-right tabular-nums font-semibold ${student.failCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {student.failCount}
                  </div>
                  <div className="col-span-1 text-right text-muted-foreground">
                    <ChevronRight className="w-4 h-4 inline" />
                  </div>
                </div>
              ))}
              {visibleStudents.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No students in this category.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down dialog */}
      <Dialog open={!!drillStudent} onOpenChange={() => setDrillStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {drillStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Eye className="w-5 h-5" />
                  {drillStudent.name} — Risk Analysis
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <Badge className={`mt-1 ${CATEGORY_BADGE_CLASSES[drillStudent.category]}`}>
                      {drillStudent.category}
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Avg CIE %</p>
                    <p className="text-2xl font-bold">{drillStudent.avgPct}%</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Intervention</p>
                    <p className="text-sm font-semibold mt-1">{drillStudent.intervention}</p>
                  </div>
                </div>

                {drillStudent.flags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Risk Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {drillStudent.flags.map((flag, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-3 h-3 mt-0.5 text-warning shrink-0" />
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Subject Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(drillStudent.subjectCIEs).map(([code, { cie, pct, subject }]) => {
                        const pred = predictPerformance(subject);
                        const barColor = pct < FAIL_PCT
                          ? "bg-destructive"
                          : pct < AT_RISK_AVG_PCT ? "bg-warning" : "bg-accent";
                        return (
                          <div key={code} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{subject.name}</span>
                              <span className="text-muted-foreground">
                                {cie.toFixed(0)}/{getMaxCIE(subject.type)} ({pct.toFixed(0)}%) → {pred.predictedGrade}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Performance Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={Object.entries(drillStudent.subjectCIEs).map(([code, { pct }]) => ({
                        subject: code, pct: Math.round(pct),
                      }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" fontSize={9} />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar dataKey="pct" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Methodology */}
      <Card className="shadow-sm border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">How Categories Are Assigned</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p><span className="font-semibold text-destructive">Critical</span> — credit-weighted CIE avg &lt; {CRITICAL_AVG_PCT}% OR 2+ failed subjects (subject CIE &lt; {FAIL_PCT}%).</p>
          <p><span className="font-semibold text-warning">At Risk</span> — credit-weighted CIE avg &lt; {AT_RISK_AVG_PCT}% OR 1 failed subject.</p>
          <p><span className="font-semibold text-accent">Safe</span> — meets both thresholds with no failed subjects.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAssessment;
