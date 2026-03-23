import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
} from "recharts";
import { TrendingUp, BarChart3, Target, Activity } from "lucide-react";

const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, F: 0 };

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(45, 80%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(0, 70%, 55%)",
];

const StudentAnalytics = ({ semesterData, grades, calculateTheoryCIE, calculateLabCIE }) => {
  const [analyticsSemester, setAnalyticsSemester] = useState("overall");

  // Build SGPA data for line chart
  const sgpaData = [];
  for (let sem = 1; sem <= 8; sem++) {
    const data = semesterData[sem];
    if (!data || data.subjects.length === 0) continue;
    let totalCredits = 0;
    let totalPoints = 0;
    let allGraded = true;
    data.subjects.forEach((sub) => {
      const g = grades[`${sem}-${sub.courseCode}`];
      if (!g) { allGraded = false; return; }
      totalCredits += sub.credits;
      totalPoints += sub.credits * gradePoints[g];
    });
    if (!allGraded || totalCredits === 0) continue;
    sgpaData.push({
      semester: `Sem ${sem}`,
      sgpa: Math.round((totalPoints / totalCredits) * 100) / 100,
    });
  }

  // Cumulative CGPA progression
  let cumulativeCredits = 0;
  let cumulativePoints = 0;
  const cgpaProgression = [];
  for (let sem = 1; sem <= 8; sem++) {
    const data = semesterData[sem];
    if (!data || data.subjects.length === 0) continue;
    let allGraded = true;
    data.subjects.forEach((sub) => {
      const g = grades[`${sem}-${sub.courseCode}`];
      if (!g) { allGraded = false; return; }
      cumulativeCredits += sub.credits;
      cumulativePoints += sub.credits * gradePoints[g];
    });
    if (!allGraded) continue;
    cgpaProgression.push({
      semester: `Sem ${sem}`,
      cgpa: Math.round((cumulativePoints / cumulativeCredits) * 100) / 100,
      sgpa: sgpaData.find(d => d.semester === `Sem ${sem}`)?.sgpa || 0,
    });
  }

  // Subject-wise CIE for a given semester
  const getSubjectCIEData = (semNum) => {
    const data = semesterData[semNum];
    if (!data) return [];
    return data.subjects.map((sub) => {
      const cie = sub.type === "theory" ? calculateTheoryCIE(sub.marks) : calculateLabCIE(sub.marks);
      const maxCIE = sub.type === "theory" ? 40 : 50;
      return {
        name: sub.courseCode,
        fullName: sub.name,
        cie: cie.total,
        maxCIE,
        percentage: Math.round((cie.total / maxCIE) * 100),
        grade: grades[`${semNum}-${sub.courseCode}`] || "—",
      };
    });
  };

  // Radar data for a semester (theory subjects only)
  const getRadarData = (semNum) => {
    const data = semesterData[semNum];
    if (!data) return [];
    return data.subjects
      .filter((s) => s.type === "theory")
      .map((sub) => {
        const cie = calculateTheoryCIE(sub.marks);
        return {
          subject: sub.courseCode,
          slipTest: (cie.slipTest / 5) * 100,
          assignment: (cie.assignment / 10) * 100,
          classTest: (cie.classTest / 20) * 100,
          attendance: (cie.attendance / 5) * 100,
        };
      });
  };

  // Detailed breakdown for individual subject
  const getSubjectBreakdown = (semNum, courseCode) => {
    const data = semesterData[semNum];
    if (!data) return null;
    const sub = data.subjects.find((s) => s.courseCode === courseCode);
    if (!sub || sub.type !== "theory") return null;
    const marks = sub.marks;
    return [
      { test: "Slip Test 1", marks: marks.slipTests[0], max: 5 },
      { test: "Slip Test 2", marks: marks.slipTests[1], max: 5 },
      { test: "Slip Test 3", marks: marks.slipTests[2], max: 5 },
      { test: "Assignment 1", marks: marks.assignments[0], max: 10 },
      { test: "Assignment 2", marks: marks.assignments[1], max: 10 },
      { test: "Class Test 1", marks: marks.classTests[0], max: 20 },
      { test: "Class Test 2", marks: marks.classTests[1], max: 20 },
      { test: "Attendance", marks: marks.attendance, max: 5 },
    ];
  };

  // Grade distribution pie chart
  const getGradeDistribution = () => {
    const dist = {};
    Object.values(grades).forEach((g) => {
      dist[g] = (dist[g] || 0) + 1;
    });
    return Object.entries(dist).map(([grade, count]) => ({
      name: grade,
      value: count,
    }));
  };

  const activeSemesters = Object.entries(semesterData)
    .filter(([, d]) => d.subjects.length > 0)
    .map(([k]) => k);

  const selectedSemNum = analyticsSemester !== "overall" ? parseInt(analyticsSemester) : null;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Analytics
        </h2>
        <Select value={analyticsSemester} onValueChange={setAnalyticsSemester}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall</SelectItem>
            {activeSemesters.map((s) => (
              <SelectItem key={s} value={s}>Semester {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {analyticsSemester === "overall" ? (
        /* ========== OVERALL VIEW ========== */
        <div className="space-y-6">
          {/* SGPA + CGPA Trend */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                GPA Trajectory
              </CardTitle>
              <CardDescription>SGPA and cumulative CGPA across semesters</CardDescription>
            </CardHeader>
            <CardContent>
              {cgpaProgression.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cgpaProgression}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 13,
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sgpa" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 5 }} name="SGPA" />
                    <Line type="monotone" dataKey="cgpa" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 5 }} strokeDasharray="5 5" name="CGPA" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Enter grades to see GPA trajectory</p>
              )}
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Grade Distribution</CardTitle>
                <CardDescription>Breakdown of all grades earned</CardDescription>
              </CardHeader>
              <CardContent>
                {getGradeDistribution().length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={getGradeDistribution()}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {getGradeDistribution().map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No grades entered yet</p>
                )}
              </CardContent>
            </Card>

            {/* Credits by Semester */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Credits per Semester</CardTitle>
                <CardDescription>Total credits attempted each semester</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={activeSemesters.map((s) => ({
                      semester: `Sem ${s}`,
                      credits: semesterData[s].subjects.reduce((t, sub) => t + sub.credits, 0),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="credits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ========== SEMESTER-SPECIFIC VIEW ========== */
        <div className="space-y-6">
          {/* CIE Bar Chart */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                CIE Scores — Semester {selectedSemNum}
              </CardTitle>
              <CardDescription>Internal assessment scores for each subject</CardDescription>
            </CardHeader>
            <CardContent>
              {getSubjectCIEData(selectedSemNum).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getSubjectCIEData(selectedSemNum)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value, name, props) => [
                        `${value}/${props.payload.maxCIE} (${props.payload.percentage}%)`,
                        "CIE",
                      ]}
                    />
                    <Bar dataKey="cie" radius={[4, 4, 0, 0]}>
                      {getSubjectCIEData(selectedSemNum).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No subjects this semester</p>
              )}
            </CardContent>
          </Card>

          {/* Radar + Subject Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Component Analysis
                </CardTitle>
                <CardDescription>Strengths across assessment components</CardDescription>
              </CardHeader>
              <CardContent>
                {getRadarData(selectedSemNum).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={getRadarData(selectedSemNum)}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Radar name="Slip Tests" dataKey="slipTest" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                      <Radar name="Assignments" dataKey="assignment" stroke="hsl(210, 70%, 55%)" fill="hsl(210, 70%, 55%)" fillOpacity={0.15} />
                      <Radar name="Class Tests" dataKey="classTest" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.15} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No theory subjects</p>
                )}
              </CardContent>
            </Card>

            {/* Per-Subject Detailed Breakdown */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Subject Breakdown</CardTitle>
                <CardDescription>Individual test scores per subject</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={semesterData[selectedSemNum]?.subjects[0]?.courseCode || ""}>
                  <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
                    {(semesterData[selectedSemNum]?.subjects || [])
                      .filter((s) => s.type === "theory")
                      .map((sub) => (
                        <TabsTrigger key={sub.courseCode} value={sub.courseCode} className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          {sub.courseCode}
                        </TabsTrigger>
                      ))}
                  </TabsList>
                  {(semesterData[selectedSemNum]?.subjects || [])
                    .filter((s) => s.type === "theory")
                    .map((sub) => {
                      const breakdown = getSubjectBreakdown(selectedSemNum, sub.courseCode);
                      if (!breakdown) return null;
                      return (
                        <TabsContent key={sub.courseCode} value={sub.courseCode}>
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={breakdown} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                              <YAxis dataKey="test" type="category" width={90} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                              <Tooltip
                                contentStyle={{
                                  background: "hsl(var(--background))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "8px",
                                }}
                                formatter={(value, name, props) => [`${value}/${props.payload.max}`, "Marks"]}
                              />
                              <Bar dataKey="marks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </TabsContent>
                      );
                    })}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAnalytics;
