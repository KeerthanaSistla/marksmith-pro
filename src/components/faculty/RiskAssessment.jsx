import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Shield, Users, TrendingDown, Eye, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { computeRiskScores, TIERS, TIER_ORDER, predictPerformance } from "@/lib/riskEngine";

// Generate mock class data for risk assessment demo
function generateMockClassData() {
  const names = [
    "Alice Johnson", "Bob Williams", "Carol Davis", "David Miller", "Emma Wilson",
    "Frank Brown", "Grace Lee", "Henry Taylor", "Ivy Chen", "Jack Anderson",
    "Karen Thomas", "Leo Martinez", "Mia Jackson", "Nathan White", "Olivia Harris",
    "Peter Clark", "Quinn Lewis", "Rachel Robinson", "Sam Walker", "Tina Young",
    "Uma King", "Victor Wright", "Wendy Scott", "Xavier Hill", "Yara Green",
    "Zane Adams", "Amy Baker", "Ben Carter", "Chloe Dean", "Dan Evans",
    "Eve Foster", "Gus Grant", "Holly Hunt", "Ian James", "Jill Kelly",
    "Kirk Long", "Lena Moore", "Mark Nash", "Nina Owen", "Oscar Park",
    "Pam Quinn", "Rex Reed", "Sara Stone", "Tom Upton", "Una Vale",
    "Vince Ward", "Willa Xie", "Yusuf Zane", "Zara Bell", "Alan Cole",
    "Beth Day", "Chad Ellis", "Dana Ford", "Eli Gray", "Fay Hall",
    "Gene Irwin", "Hope Jay", "Ivan Knox", "Jade Lane",
  ];

  const subjects = [
    { courseCode: "22CSC21", name: "Software Engineering", type: "theory", credits: 4 },
    { courseCode: "22ITC08", name: "Enterprise App Dev", type: "theory", credits: 4 },
    { courseCode: "22CAC17", name: "Machine Learning", type: "theory", credits: 4 },
    { courseCode: "22ITC10", name: "Computer Networks", type: "theory", credits: 3 },
    { courseCode: "22ITC12", name: "Automata Theory", type: "theory", credits: 3 },
    { courseCode: "22CSC23", name: "CASE Tools Lab", type: "lab", credits: 1 },
    { courseCode: "22ITC09", name: "EAD Lab", type: "lab", credits: 1 },
    { courseCode: "22CAC18", name: "ML Lab", type: "lab", credits: 1 },
  ];

  const rand = (min, max) => Math.round(min + Math.random() * (max - min));

  return names.map((name, i) => ({
    id: `s${i + 1}`,
    name,
    rollNo: `CSE-3A-${String(i + 1).padStart(3, "0")}`,
    subjects: subjects.map(sub => {
      if (sub.type === "theory") {
        const base = rand(1, 5);
        return {
          ...sub,
          marks: {
            slipTests: [rand(Math.max(0, base - 1), 5), rand(Math.max(0, base - 1), 5), rand(Math.max(0, base - 1), 5)],
            assignments: [rand(Math.max(3, base), 10), rand(Math.max(3, base), 10)],
            classTests: [rand(Math.max(5, base * 2), 20), rand(Math.max(5, base * 2), 20)],
            attendance: rand(Math.max(1, base - 1), 5),
          },
        };
      }
      return {
        ...sub,
        marks: {
          weeklyCIE: [rand(15, 30), rand(15, 30), rand(15, 30)],
          internalTests: [rand(10, 20), rand(10, 20)],
        },
      };
    }),
  }));
}

const TIER_BADGE_CLASSES = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-orange-500 text-white",
  Moderate: "bg-yellow-400 text-yellow-900",
  Watch: "bg-accent text-accent-foreground",
};

const RiskAssessment = () => {
  const [drillStudent, setDrillStudent] = useState(null);

  const mockStudents = useMemo(() => generateMockClassData(), []);
  const { riskStudents, subjectStats, summary } = useMemo(() => computeRiskScores(mockStudents), [mockStudents]);

  // Tier donut data
  const tierData = TIER_ORDER
    .filter(t => summary.tiers[t] > 0)
    .map(t => ({ name: t, value: summary.tiers[t], color: TIERS[t].hex }));

  // Score distribution histogram
  const scoreHistogram = useMemo(() => {
    const bins = [];
    for (let i = 0; i < 100; i += 10) {
      bins.push({ range: `${i}-${i + 9}`, count: riskStudents.filter(s => s.score >= i && s.score < i + 10).length });
    }
    return bins.filter(b => b.count > 0);
  }, [riskStudents]);

  // Subject failure data
  const subjectFailData = subjectStats.map(s => ({
    name: s.name.length > 18 ? s.name.substring(0, 18) + "…" : s.name,
    failures: s.failures,
    passRate: s.passRate,
    fullName: s.name,
  }));

  // Scatter data
  const scatterData = riskStudents.map(s => ({
    avgPct: s.avgPct,
    score: s.score,
    name: s.name,
    tier: s.tier,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-5 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-3xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-destructive/30">
          <CardContent className="pt-5 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-xs text-muted-foreground">At Risk</p>
            <p className="text-3xl font-bold text-destructive">{summary.atRisk}</p>
            <p className="text-xs text-muted-foreground">{((summary.atRisk / summary.total) * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-5 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-xs text-muted-foreground">Safe</p>
            <p className="text-3xl font-bold text-accent">{summary.safe}</p>
          </CardContent>
        </Card>
        {TIER_ORDER.slice(0, 2).map(tier => (
          <Card key={tier} className="shadow-md">
            <CardContent className="pt-5 text-center">
              <p className="text-xs text-muted-foreground">{tier}</p>
              <p className="text-3xl font-bold" style={{ color: TIERS[tier].hex }}>{summary.tiers[tier]}</p>
              <p className="text-xs text-muted-foreground">{tier === "Critical" ? "Immediate" : "This week"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tier Donut */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Risk Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {tierData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Risk Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreHistogram}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="range" fontSize={11} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scatter: Risk Score vs Average */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Risk Score vs Academic Average</CardTitle>
          <CardDescription>Each dot = one at-risk student</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="avgPct" name="Avg %" unit="%" fontSize={11} />
              <YAxis dataKey="score" name="Risk Score" fontSize={11} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-2 text-xs shadow-lg">
                      <p className="font-semibold">{d.name}</p>
                      <p>Avg: {d.avgPct}% | Score: {d.score}</p>
                      <Badge className={`text-xs mt-1 ${TIER_BADGE_CLASSES[d.tier]}`}>{d.tier}</Badge>
                    </div>
                  );
                }}
              />
              {TIER_ORDER.map(tier => (
                <Scatter key={tier} name={tier}
                  data={scatterData.filter(s => s.tier === tier)}
                  fill={TIERS[tier].hex} />
              ))}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Failure Analysis */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Subject-Level Failure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subjectFailData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" fontSize={10} width={130} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-2 text-xs shadow-lg">
                      <p className="font-semibold">{d.fullName}</p>
                      <p>Failures: {d.failures} | Pass Rate: {d.passRate}%</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="failures" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Failures (<40%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Intervention Priority List */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Intervention Priority List
          </CardTitle>
          <CardDescription>Double-click a student to view detailed analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 grid grid-cols-12 gap-2 text-xs font-semibold">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Roll No</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-1">Tier</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-1">Avg %</div>
              <div className="col-span-1">Fails</div>
              <div className="col-span-2">Action</div>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {riskStudents.slice(0, 20).map((student, i) => (
                <div
                  key={student.id}
                  className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                  onDoubleClick={() => setDrillStudent(student)}
                >
                  <div className="col-span-1 text-muted-foreground">{i + 1}</div>
                  <div className="col-span-2 font-mono text-xs">{student.rollNo}</div>
                  <div className="col-span-3 font-medium">{student.name}</div>
                  <div className="col-span-1">
                    <Badge className={`text-xs ${TIER_BADGE_CLASSES[student.tier]}`}>{student.tier}</Badge>
                  </div>
                  <div className="col-span-1 font-bold">{student.score}</div>
                  <div className="col-span-1">{student.avgPct}%</div>
                  <div className="col-span-1 text-destructive font-semibold">{student.failCount}</div>
                  <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                    {student.intervention}
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Drill-down Dialog */}
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
                {/* Overview */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <p className="text-2xl font-bold" style={{ color: TIERS[drillStudent.tier].hex }}>{drillStudent.score}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <Badge className={`mt-1 ${TIER_BADGE_CLASSES[drillStudent.tier]}`}>{drillStudent.tier}</Badge>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Avg %</p>
                    <p className="text-2xl font-bold">{drillStudent.avgPct}%</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Intervention</p>
                    <p className="text-sm font-semibold mt-1">{drillStudent.intervention}</p>
                  </div>
                </div>

                {/* Risk Flags */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Risk Flags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {drillStudent.flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-3 h-3 mt-0.5 text-destructive shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Subject-wise CIE Heatmap */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Subject Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(drillStudent.subjectCIEs).map(([code, { cie, pct, subject }]) => {
                        const pred = predictPerformance(subject);
                        const barColor = pct < 40 ? "bg-destructive" : pct < 60 ? "bg-warning" : "bg-accent";
                        return (
                          <div key={code} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{subject.name}</span>
                              <span className="text-muted-foreground">
                                {cie.toFixed(0)}/{getMaxCIE(subject.type)} ({pct.toFixed(0)}%) → {pred.predictedGrade}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Radar Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Performance Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={Object.entries(drillStudent.subjectCIEs).map(([code, { pct, subject }]) => ({
                        subject: code,
                        pct: Math.round(pct),
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

      {/* Risk Score Methodology */}
      <Card className="shadow-sm border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Risk Score Methodology</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>+15 pts per subject below 40% of max marks | +8 pts per high-credit subject (&ge;3 credits) below 50%</p>
          <p>+3 pts per subject in bottom 25th percentile | +20 pts if weighted avg &lt;50% | +10 pts if 50-60%</p>
          <p>+10 pts if 2+ lab failures | Score capped at 100 | Tiers: Critical (75-100), High (50-74), Moderate (25-49), Watch (1-24)</p>
        </CardContent>
      </Card>
    </div>
  );
};

function getMaxCIE(type) {
  return type === "theory" ? 40 : 50;
}

export default RiskAssessment;
