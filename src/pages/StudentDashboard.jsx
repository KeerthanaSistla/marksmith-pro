import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  BookOpen,
  BarChart3,
  FileText,
  ClipboardList,
  FileCheck,
  Calendar,
  Settings,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Activity,
  Brain,
} from "lucide-react";
import StudentAnalytics from "@/components/student/StudentAnalytics";
import StudentRiskAssessment from "@/components/student/RiskAssessment";
import { buildStudentSemesterData, getDefaultStudentId, getStudent, getSection, getBatch } from "@/lib/dataStore";

const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, F: 0 };
const gradeOptions = ["S", "A", "B", "C", "D", "F"];
const gradeColors = {
  S: "bg-accent text-accent-foreground",
  A: "bg-primary text-primary-foreground",
  B: "bg-info text-primary-foreground",
  C: "bg-warning text-primary-foreground",
  D: "bg-muted text-muted-foreground",
  F: "bg-destructive text-destructive-foreground",
};

// Logged-in student (mock = first student of IT1 / batch 2023). Pulls live
// data from the unified store, so faculty mark uploads are reflected here.
const studentId = getDefaultStudentId();
const studentRecord = studentId ? getStudent(studentId) : null;
const studentSection = studentRecord ? getSection(studentRecord.sectionId) : null;
const studentBatch = studentRecord ? getBatch(studentRecord.batchId) : null;
const mockSemesterData = studentId
  ? buildStudentSemesterData(studentId)
  : { 1: { subjects: [] }, 2: { subjects: [] }, 3: { subjects: [] }, 4: { subjects: [] }, 5: { subjects: [] }, 6: { subjects: [] }, 7: { subjects: [] }, 8: { subjects: [] } };

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [currentSemester, setCurrentSemester] = useState(String(studentSection?.currentSemester || 3));
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [grades, setGrades] = useState(() => {
    // Initialize from mock data
    const initial = {};
    Object.entries(mockSemesterData).forEach(([sem, data]) => {
      data.subjects.forEach((sub) => {
        if (sub.grade) initial[`${sem}-${sub.courseCode}`] = sub.grade;
      });
    });
    return initial;
  });

  const calculateTheoryCIE = (marks) => {
    const avgSlipTest = marks.slipTests.reduce((a, b) => a + b, 0) / marks.slipTests.length;
    const avgAssignment = marks.assignments.reduce((a, b) => a + b, 0) / marks.assignments.length;
    const avgClassTest = marks.classTests.reduce((a, b) => a + b, 0) / marks.classTests.length;
    return {
      slipTest: Math.round(avgSlipTest * 10) / 10,
      assignment: Math.round(avgAssignment * 10) / 10,
      classTest: Math.round(avgClassTest * 10) / 10,
      attendance: marks.attendance,
      total: Math.round((avgSlipTest + avgAssignment + avgClassTest + marks.attendance) * 10) / 10,
    };
  };

  const calculateLabCIE = (marks) => {
    const weeklyCIETotal = marks.weeklyCIE.reduce((a, b) => a + b, 0);
    const internalTestTotal = marks.internalTests.reduce((a, b) => a + b, 0);
    return { weeklyCIE: weeklyCIETotal, internalTests: internalTestTotal, total: weeklyCIETotal + internalTestTotal };
  };

  const getCIETotal = (subject) => {
    return subject.type === "theory" ? calculateTheoryCIE(subject.marks).total : calculateLabCIE(subject.marks).total;
  };

  const calculateSGPA = (semesterNum) => {
    const data = mockSemesterData[semesterNum];
    if (!data || data.subjects.length === 0) return null;
    let totalCredits = 0;
    let totalPoints = 0;
    let allGraded = true;
    data.subjects.forEach((sub) => {
      const g = grades[`${semesterNum}-${sub.courseCode}`];
      if (!g) { allGraded = false; return; }
      totalCredits += sub.credits;
      totalPoints += sub.credits * gradePoints[g];
    });
    if (!allGraded || totalCredits === 0) return null;
    return Math.round((totalPoints / totalCredits) * 100) / 100;
  };

  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    for (let sem = 1; sem <= 8; sem++) {
      const data = mockSemesterData[sem];
      if (!data || data.subjects.length === 0) continue;
      let allGraded = true;
      data.subjects.forEach((sub) => {
        const g = grades[`${sem}-${sub.courseCode}`];
        if (!g) { allGraded = false; return; }
        totalCredits += sub.credits;
        totalPoints += sub.credits * gradePoints[g];
      });
      if (!allGraded) continue;
    }
    if (totalCredits === 0) return null;
    return Math.round((totalPoints / totalCredits) * 100) / 100;
  };

  const handleGradeChange = (semesterNum, courseCode, grade) => {
    setGrades((prev) => ({ ...prev, [`${semesterNum}-${courseCode}`]: grade }));
  };

  const semData = mockSemesterData[currentSemester] || { subjects: [] };
  const sgpa = calculateSGPA(parseInt(currentSemester));
  const cgpa = calculateCGPA();

  // Find current semester (latest with subjects)
  const latestSemester = Object.entries(mockSemesterData)
    .filter(([, d]) => d.subjects.length > 0)
    .map(([k]) => parseInt(k))
    .sort((a, b) => b - a)[0] || 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Student Portal</h1>
                <p className="text-primary-foreground/90 text-sm">{studentRecord?.name || "Student"} • {studentRecord?.rollNumber || ""} • {studentSection?.name} ({studentBatch?.name})</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => navigate("/student/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <Tabs defaultValue="academics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-6">
            <TabsTrigger value="academics" className="text-base">
              <BookOpen className="w-4 h-4 mr-2" />
              Academics
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-base">
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-base">
              <Brain className="w-4 h-4 mr-2" />
              Risk & Predictions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academics" className="space-y-8">
        {/* Semester Selector + GPA Summary */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Semester Selector */}
          <Card className="flex-1 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Semester</p>
                  <Select value={currentSemester} onValueChange={setCurrentSemester}>
                    <SelectTrigger className="w-[200px] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          Semester {s}
                          {s === latestSemester ? " (Current)" : ""}
                          {mockSemesterData[s]?.subjects.length === 0 ? " — Upcoming" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subjects</p>
                    <p className="text-2xl font-bold text-foreground">{semData.subjects.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Credits</p>
                    <p className="text-2xl font-bold text-foreground">
                      {semData.subjects.reduce((t, s) => t + s.credits, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GPA Cards */}
          <div className="flex gap-4">
            <Card className="shadow-md min-w-[140px]">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">SGPA</p>
                <p className="text-3xl font-bold text-primary">{sgpa ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Sem {currentSemester}</p>
              </CardContent>
            </Card>
            <Card className="shadow-md min-w-[140px]">
              <CardContent className="pt-6 text-center">
                <Award className="w-5 h-5 mx-auto mb-1 text-accent" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CGPA</p>
                <p className="text-3xl font-bold text-accent">{cgpa ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Overall</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Grade Scale Reference */}
        <Card className="shadow-sm">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted-foreground font-medium">Grade Scale:</span>
              {[
                { g: "S", r: "≥90" },
                { g: "A", r: "≥80" },
                { g: "B", r: "≥70" },
                { g: "C", r: "≥60" },
                { g: "D", r: "≥50" },
                { g: "F", r: "<50" },
              ].map(({ g, r }) => (
                <Badge key={g} variant="outline" className="text-xs">
                  {g} ({r})
                </Badge>
              ))}
              <span className="text-muted-foreground ml-auto">CIE: 40 + SEE: 60 = 100</span>
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        {semData.subjects.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">No subjects registered for this semester yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subjects — Semester {currentSemester}
            </h2>

            {semData.subjects.map((subject) => {
              const isExpanded = expandedSubject === subject.courseCode;
              const cie = subject.type === "theory" ? calculateTheoryCIE(subject.marks) : calculateLabCIE(subject.marks);
              const maxCIE = subject.type === "theory" ? 40 : 50;
              const gradeKey = `${currentSemester}-${subject.courseCode}`;
              const currentGrade = grades[gradeKey];

              return (
                <Card key={subject.courseCode} className="shadow-md overflow-hidden">
                  {/* Subject Header — always visible */}
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedSubject(isExpanded ? null : subject.courseCode)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg">{subject.courseCode}</span>
                          <Badge variant={subject.type === "theory" ? "default" : "secondary"}>
                            {subject.type === "theory" ? "Theory" : "Lab"}
                          </Badge>
                          <Badge variant="outline">{subject.credits} Cr</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{subject.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* CIE Score */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">CIE</p>
                        <p className="text-xl font-bold text-primary">
                          {cie.total}<span className="text-sm text-muted-foreground">/{maxCIE}</span>
                        </p>
                      </div>

                      {/* Grade */}
                      <div className="text-right min-w-[60px]">
                        <p className="text-xs text-muted-foreground mb-1">Grade</p>
                        {currentGrade ? (
                          <Badge className={`text-base px-3 py-0.5 ${gradeColors[currentGrade] || ""}`}>
                            {currentGrade}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t">
                      <div className="px-6 py-6 space-y-6">
                        {subject.type === "theory" ? (
                          /* Theory CIE Breakdown */
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-muted/30 border-muted">
                              <CardContent className="pt-4 pb-4 text-center">
                                <FileText className="w-4 h-4 mx-auto mb-1 text-primary" />
                                <p className="text-xs text-muted-foreground mb-1">Slip Tests (avg of 3)</p>
                                <p className="text-2xl font-bold text-primary">{cie.slipTest}<span className="text-sm text-muted-foreground">/5</span></p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subject.marks.slipTests.join(", ")}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-muted">
                              <CardContent className="pt-4 pb-4 text-center">
                                <ClipboardList className="w-4 h-4 mx-auto mb-1 text-primary" />
                                <p className="text-xs text-muted-foreground mb-1">Assignments (avg of 2)</p>
                                <p className="text-2xl font-bold text-primary">{cie.assignment}<span className="text-sm text-muted-foreground">/10</span></p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subject.marks.assignments.join(", ")}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-muted">
                              <CardContent className="pt-4 pb-4 text-center">
                                <FileCheck className="w-4 h-4 mx-auto mb-1 text-primary" />
                                <p className="text-xs text-muted-foreground mb-1">Class Tests (avg of 2)</p>
                                <p className="text-2xl font-bold text-primary">{cie.classTest}<span className="text-sm text-muted-foreground">/20</span></p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subject.marks.classTests.join(", ")}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-muted">
                              <CardContent className="pt-4 pb-4 text-center">
                                <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                                <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                                <p className="text-2xl font-bold text-primary">{cie.attendance}<span className="text-sm text-muted-foreground">/5</span></p>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          /* Lab CIE Breakdown */
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-muted/30 border-muted">
                              <CardContent className="pt-4 pb-4 text-center">
                                <FileText className="w-4 h-4 mx-auto mb-1 text-primary" />
                                <p className="text-xs text-muted-foreground mb-1">Weekly CIE</p>
                                <p className="text-2xl font-bold text-primary">{cie.weeklyCIE}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subject.marks.weeklyCIE.join(", ")}
                                </p>
                              </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-muted">
                              <CardContent className="pt-4 pb-4 text-center">
                                <FileCheck className="w-4 h-4 mx-auto mb-1 text-primary" />
                                <p className="text-xs text-muted-foreground mb-1">Internal Tests</p>
                                <p className="text-2xl font-bold text-primary">{cie.internalTests}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {subject.marks.internalTests.join(", ")}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {/* CIE + SEE Summary & Grade Entry */}
                        <div className="flex items-center justify-between bg-muted/20 rounded-lg p-4 border">
                          <div className="flex gap-8">
                            <div>
                              <p className="text-xs text-muted-foreground">CIE ({subject.type === "theory" ? "40" : "50"})</p>
                              <p className="text-xl font-bold text-primary">{cie.total}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">SEE (60)</p>
                              <p className="text-xl font-bold text-muted-foreground">—</p>
                              <p className="text-xs text-muted-foreground">External exam</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Final Grade</p>
                              <Select
                                value={currentGrade || ""}
                                onValueChange={(v) => handleGradeChange(currentSemester, subject.courseCode, v)}
                              >
                                <SelectTrigger className="w-[100px] h-9">
                                  <SelectValue placeholder="Set" />
                                </SelectTrigger>
                                <SelectContent>
                                  {gradeOptions.map((g) => (
                                    <SelectItem key={g} value={g}>
                                      {g}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Semester-wise SGPA Overview */}
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" />
              Semester-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const s = calculateSGPA(sem);
                const hasSubs = mockSemesterData[sem]?.subjects.length > 0;
                return (
                  <div
                    key={sem}
                    className={`text-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      String(sem) === currentSemester
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setCurrentSemester(String(sem))}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Sem {sem}</p>
                    <p className={`text-lg font-bold ${s ? "text-primary" : "text-muted-foreground"}`}>
                      {s ?? (hasSubs ? "—" : "·")}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <StudentAnalytics
              semesterData={mockSemesterData}
              grades={grades}
              calculateTheoryCIE={calculateTheoryCIE}
              calculateLabCIE={calculateLabCIE}
            />
          </TabsContent>

          <TabsContent value="risk">
            <StudentRiskAssessment
              semesterData={mockSemesterData}
              grades={grades}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
