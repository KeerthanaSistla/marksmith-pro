import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import { BarChart3, Users, TrendingUp, Activity, ArrowLeft, Target } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(45, 80%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(0, 70%, 55%)",
];

// Mock detailed student marks for each subject
const mockSubjectStudentData = {
  sub1: [
    { rollNo: "CSE-3A-001", name: "Alice Johnson", slipTests: [4, 5, 3], assignments: [8, 9], classTests: [16, 18], attendance: 4 },
    { rollNo: "CSE-3A-002", name: "Bob Williams", slipTests: [3, 4, 5], assignments: [7, 8], classTests: [15, 17], attendance: 5 },
    { rollNo: "CSE-3A-003", name: "Carol Davis", slipTests: [5, 4, 4], assignments: [9, 10], classTests: [18, 19], attendance: 5 },
    { rollNo: "CSE-3A-004", name: "David Miller", slipTests: [2, 3, 3], assignments: [6, 7], classTests: [12, 14], attendance: 3 },
    { rollNo: "CSE-3A-005", name: "Emma Wilson", slipTests: [5, 5, 5], assignments: [10, 10], classTests: [20, 19], attendance: 5 },
    { rollNo: "CSE-3A-006", name: "Frank Brown", slipTests: [3, 2, 4], assignments: [7, 6], classTests: [13, 15], attendance: 4 },
    { rollNo: "CSE-3A-007", name: "Grace Lee", slipTests: [4, 4, 5], assignments: [8, 9], classTests: [17, 16], attendance: 5 },
    { rollNo: "CSE-3A-008", name: "Henry Taylor", slipTests: [1, 2, 2], assignments: [5, 4], classTests: [10, 11], attendance: 2 },
  ],
  sub3: [
    { rollNo: "CSE-3B-001", name: "Ian Moore", slipTests: [4, 3, 4], assignments: [8, 7], classTests: [16, 15], attendance: 4 },
    { rollNo: "CSE-3B-002", name: "Jane Clark", slipTests: [5, 5, 4], assignments: [9, 10], classTests: [18, 19], attendance: 5 },
    { rollNo: "CSE-3B-003", name: "Kevin Hall", slipTests: [3, 3, 2], assignments: [6, 5], classTests: [14, 12], attendance: 3 },
    { rollNo: "CSE-3B-004", name: "Lisa Young", slipTests: [4, 5, 5], assignments: [10, 9], classTests: [19, 18], attendance: 5 },
    { rollNo: "CSE-3B-005", name: "Mike King", slipTests: [2, 3, 3], assignments: [7, 6], classTests: [11, 13], attendance: 4 },
  ],
};

const calcCIE = (s) => {
  const st = s.slipTests.reduce((a, b) => a + b, 0) / s.slipTests.length;
  const as_ = s.assignments.reduce((a, b) => a + b, 0) / s.assignments.length;
  const ct = s.classTests.reduce((a, b) => a + b, 0) / s.classTests.length;
  return Math.round((st + as_ + ct + s.attendance) * 10) / 10;
};

const FacultyAnalytics = ({ subjects }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "");
  const [drillStudent, setDrillStudent] = useState(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const students = mockSubjectStudentData[selectedSubjectId] || [];

  // Class-level stats
  const studentCIEs = students.map((s) => ({
    ...s,
    cie: calcCIE(s),
    slipTestAvg: Math.round((s.slipTests.reduce((a, b) => a + b, 0) / s.slipTests.length) * 10) / 10,
    assignmentAvg: Math.round((s.assignments.reduce((a, b) => a + b, 0) / s.assignments.length) * 10) / 10,
    classTestAvg: Math.round((s.classTests.reduce((a, b) => a + b, 0) / s.classTests.length) * 10) / 10,
  }));

  const avgCIE = studentCIEs.length > 0
    ? Math.round((studentCIEs.reduce((t, s) => t + s.cie, 0) / studentCIEs.length) * 10) / 10
    : 0;
  const maxCIE = studentCIEs.length > 0 ? Math.max(...studentCIEs.map((s) => s.cie)) : 0;
  const minCIE = studentCIEs.length > 0 ? Math.min(...studentCIEs.map((s) => s.cie)) : 0;

  // Distribution buckets
  const distribution = [
    { range: "0-10", count: 0 },
    { range: "11-20", count: 0 },
    { range: "21-30", count: 0 },
    { range: "31-40", count: 0 },
  ];
  studentCIEs.forEach((s) => {
    if (s.cie <= 10) distribution[0].count++;
    else if (s.cie <= 20) distribution[1].count++;
    else if (s.cie <= 30) distribution[2].count++;
    else distribution[3].count++;
  });

  // Subject comparison across all subjects
  const subjectComparison = subjects
    .filter((s) => s.type === "theory" && mockSubjectStudentData[s.id])
    .map((s) => {
      const stds = mockSubjectStudentData[s.id] || [];
      const avg = stds.length > 0
        ? Math.round((stds.reduce((t, st) => t + calcCIE(st), 0) / stds.length) * 10) / 10
        : 0;
      return { name: s.courseCode, avg, students: stds.length };
    });

  // Individual student breakdown for drill-down
  const getDrillData = (student) => {
    return [
      { component: "Slip Test 1", marks: student.slipTests[0], max: 5 },
      { component: "Slip Test 2", marks: student.slipTests[1], max: 5 },
      { component: "Slip Test 3", marks: student.slipTests[2], max: 5 },
      { component: "Assignment 1", marks: student.assignments[0], max: 10 },
      { component: "Assignment 2", marks: student.assignments[1], max: 10 },
      { component: "Class Test 1", marks: student.classTests[0], max: 20 },
      { component: "Class Test 2", marks: student.classTests[1], max: 20 },
      { component: "Attendance", marks: student.attendance, max: 5 },
    ];
  };

  const getStudentRadar = (student) => {
    const st = student.slipTests.reduce((a, b) => a + b, 0) / student.slipTests.length;
    const as_ = student.assignments.reduce((a, b) => a + b, 0) / student.assignments.length;
    const ct = student.classTests.reduce((a, b) => a + b, 0) / student.classTests.length;
    return [
      { metric: "Slip Tests", value: (st / 5) * 100, classAvg: studentCIEs.length > 0 ? (studentCIEs.reduce((t, s) => t + s.slipTestAvg, 0) / studentCIEs.length / 5) * 100 : 0 },
      { metric: "Assignments", value: (as_ / 10) * 100, classAvg: studentCIEs.length > 0 ? (studentCIEs.reduce((t, s) => t + s.assignmentAvg, 0) / studentCIEs.length / 10) * 100 : 0 },
      { metric: "Class Tests", value: (ct / 20) * 100, classAvg: studentCIEs.length > 0 ? (studentCIEs.reduce((t, s) => t + s.classTestAvg, 0) / studentCIEs.length / 20) * 100 : 0 },
      { metric: "Attendance", value: (student.attendance / 5) * 100, classAvg: studentCIEs.length > 0 ? (studentCIEs.reduce((t, s) => t + s.attendance, 0) / studentCIEs.length / 5) * 100 : 0 },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Analytics
        </h2>
        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subjects.filter(s => s.type === "theory").map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.courseCode} — {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Students</p>
            <p className="text-2xl font-bold text-foreground">{studentCIEs.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg CIE</p>
            <p className="text-2xl font-bold text-primary">{avgCIE}<span className="text-sm text-muted-foreground">/40</span></p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Highest</p>
            <p className="text-2xl font-bold text-accent">{maxCIE}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lowest</p>
            <p className="text-2xl font-bold text-destructive">{minCIE}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* CIE Distribution */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              CIE Distribution
            </CardTitle>
            <CardDescription>How students are scoring across ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Comparison */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Subject Comparison
            </CardTitle>
            <CardDescription>Average CIE across your subjects</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 40]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Avg CIE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No theory subjects with data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student-wise CIE — clickable rows */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student-wise CIE
          </CardTitle>
          <CardDescription>Double-click on a student to drill down into their performance</CardDescription>
        </CardHeader>
        <CardContent>
          {studentCIEs.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentCIEs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="rollNo" type="category" width={100} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value) => [`${value}/40`, "CIE"]}
                  />
                  <Bar dataKey="cie" radius={[0, 4, 4, 0]}>
                    {studentCIEs.map((s, i) => (
                      <Cell
                        key={i}
                        fill={s.cie >= 30 ? "hsl(var(--primary))" : s.cie >= 20 ? "hsl(45, 80%, 50%)" : "hsl(var(--destructive))"}
                        cursor="pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Student list for double-click */}
              <div className="mt-4 border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {studentCIEs.map((student) => (
                  <div
                    key={student.rollNo}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onDoubleClick={() => setDrillStudent(student)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">{student.rollNo}</span>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">{student.cie}/40</span>
                      <Badge variant={student.cie >= 30 ? "default" : student.cie >= 20 ? "secondary" : "destructive"} className="text-xs">
                        {student.cie >= 30 ? "Good" : student.cie >= 20 ? "Average" : "At Risk"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Double-click a student row to view detailed analysis</p>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">No student data for this subject</p>
          )}
        </CardContent>
      </Card>

      {/* Student Drill-Down Dialog */}
      <Dialog open={!!drillStudent} onOpenChange={(open) => !open && setDrillStudent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {drillStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Target className="w-5 h-5" />
                  {drillStudent.name}
                  <Badge variant="outline" className="ml-2">{drillStudent.rollNo}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total CIE</p>
                      <p className="text-2xl font-bold text-primary">{drillStudent.cie}<span className="text-sm text-muted-foreground">/40</span></p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Class Avg</p>
                      <p className="text-2xl font-bold text-muted-foreground">{avgCIE}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Rank</p>
                      <p className="text-2xl font-bold text-accent">
                        {studentCIEs.filter((s) => s.cie > drillStudent.cie).length + 1}/{studentCIEs.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Component Breakdown Bar */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Component-wise Marks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={getDrillData(drillStudent)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="component" type="category" width={100} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(value, name, props) => [`${value}/${props.payload.max}`, "Marks"]}
                        />
                        <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Radar vs Class Average */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Performance vs Class Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={getStudentRadar(drillStudent)}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Radar name="Student" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                        <Radar name="Class Avg" dataKey="classAvg" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeDasharray="4 4" />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyAnalytics;
