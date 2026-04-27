import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, BookOpen, Upload, Eye, Activity, Brain, LogOut } from "lucide-react";
import FacultyAnalytics from "@/components/faculty/FacultyAnalytics";
import RiskAssessment from "@/components/faculty/RiskAssessment";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getStore,
  getAssignmentsForFaculty,
  updateAssessment,
  computeTheoryCIE,
  computeLabCIE,
  CIE_MAX_THEORY,
  CIE_MAX_LAB,
  DEFAULT_FACULTY_ID,
} from "@/lib/dataStore";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Logged-in faculty (mock)
  const facultyId = DEFAULT_FACULTY_ID;
  const store = getStore();
  const me = store.faculty.find((f) => f.id === facultyId);

  // All teaching assignments for this faculty, enriched with subject + section
  const myAssignments = useMemo(() => {
    return getAssignmentsForFaculty(facultyId).map((a) => {
      const sub = store.subjects.find((s) => s.code === a.subjectCode);
      const sec = store.sections.find((s) => s.id === a.sectionId);
      const batch = store.batches.find((b) => b.id === a.batchId);
      return {
        ...a,
        subject: sub,
        section: sec,
        batch,
      };
    });
  }, [facultyId, store]);

  // Academic year filter
  const academicYears = useMemo(() => {
    const set = new Set(myAssignments.map((a) => a.academicYear).filter(Boolean));
    return Array.from(set).sort();
  }, [myAssignments]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");

  const displayedAssignments = useMemo(() => {
    if (selectedAcademicYear === "all") return myAssignments;
    return myAssignments.filter((a) => a.academicYear === selectedAcademicYear);
  }, [myAssignments, selectedAcademicYear]);

  const subjectsByYear = useMemo(() => {
    const map = {};
    for (const a of myAssignments) {
      const y = a.academicYear || "—";
      (map[y] = map[y] || []).push(a);
    }
    return map;
  }, [myAssignments]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(myAssignments[0]?.id || "");
  const selected = myAssignments.find((a) => a.id === selectedAssignmentId);

  const [selectedTest, setSelectedTest] = useState("");
  const [bulkMarks, setBulkMarks] = useState({});
  const [, forceTick] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const isTheory = selected?.subject?.type === "T";

  const getTestOptions = () => {
    if (!selected) return [];
    if (isTheory) {
      return [
        { value: "sliptest1", label: "Slip Test 1 (Max 5)", max: 5 },
        { value: "sliptest2", label: "Slip Test 2 (Max 5)", max: 5 },
        { value: "sliptest3", label: "Slip Test 3 (Max 5)", max: 5 },
        { value: "assignment1", label: "Assignment 1 (Max 10)", max: 10 },
        { value: "assignment2", label: "Assignment 2 (Max 10)", max: 10 },
        { value: "classtest1", label: "Class Test 1 (Max 20)", max: 20 },
        { value: "classtest2", label: "Class Test 2 (Max 20)", max: 20 },
        { value: "attendance", label: "Attendance (Max 5)", max: 5 },
      ];
    }
    return [
      { value: "weeklycie1", label: "Weekly CIE 1 (Max 30)", max: 30 },
      { value: "weeklycie2", label: "Weekly CIE 2 (Max 30)", max: 30 },
      { value: "weeklycie3", label: "Weekly CIE 3 (Max 30)", max: 30 },
      { value: "internaltest1", label: "Internal Test 1 (Max 20)", max: 20 },
      { value: "internaltest2", label: "Internal Test 2 (Max 20)", max: 20 },
    ];
  };

  const classStudents = useMemo(() => {
    if (!selected) return [];
    return selected.studentIds
      .map((sid) => store.students.find((st) => st.id === sid))
      .filter(Boolean);
  }, [selected, store]);

  const handleBulkMarkChange = (sid, val) => {
    setBulkMarks((prev) => ({ ...prev, [sid]: val }));
  };

  const handleSubmitBulkMarks = () => {
    if (!selectedTest || !selected) {
      toast({ title: "Error", description: "Please select an assessment", variant: "destructive" });
      return;
    }
    const filtered = Object.fromEntries(
      Object.entries(bulkMarks).filter(([, v]) => v !== "" && v != null),
    );
    if (!Object.keys(filtered).length) {
      toast({ title: "Nothing to submit", description: "Enter marks for at least one student", variant: "destructive" });
      return;
    }
    updateAssessment(selected.id, selectedTest, filtered);
    toast({
      title: "Marks Saved",
      description: `${selectedTest.toUpperCase()} updated for ${Object.keys(filtered).length} students`,
    });
    setBulkMarks({});
    forceTick((n) => n + 1);
  };

  // ── Subject-wise view: show every student's CIE breakdown ──
  const subjectWise = useMemo(() => {
    if (!selected) return [];
    return classStudents.map((st) => {
      const m = store.marks[`${selected.id}|${st.id}`] || {};
      if (isTheory) {
        const c = computeTheoryCIE(m);
        return {
          ...st,
          slipTest: c.slipTest,
          assignment: c.assignment,
          classTest: c.classTest,
          attendance: c.attendance,
          total: c.total,
          max: CIE_MAX_THEORY,
          slipTests: m.slipTests || [],
          assignments: m.assignments || [],
          classTests: m.classTests || [],
        };
      }
      const c = computeLabCIE(m);
      return {
        ...st,
        weeklyCIE: c.weeklyCIE,
        internalTests: c.internalTests,
        total: c.total,
        max: CIE_MAX_LAB,
        weeklies: m.weeklyCIE || [],
        internals: m.internalTests || [],
      };
    });
  }, [selected, classStudents, store, isTheory]);

  // Adapter for analytics components that expect 'theory'/'lab' types
  const analyticsSubjects = useMemo(() => {
    return myAssignments.map((a) => ({
      id: a.id,
      courseCode: a.subject.code,
      name: a.subject.name,
      type: a.subject.type === "T" ? "theory" : "lab",
      credits: a.subject.credits,
      class: a.section?.name,
      students: a.studentIds.length,
    }));
  }, [myAssignments]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary via-primary/80 to-accent text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Faculty Portal</h1>
                <p className="text-sm opacity-80">{me?.name} • {me?.designation}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/faculty/settings")}
                className="gap-2 text-primary-foreground hover:bg-white/10 border border-white/20"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="gap-2 text-primary-foreground hover:bg-white/10 border border-white/20"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-8">
            <TabsTrigger value="subjects" className="text-base">
              <BookOpen className="w-4 h-4 mr-2" /> Subjects & Marks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-base">
              <Activity className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-base">
              <Brain className="w-4 h-4 mr-2" /> Risk Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            {/* Subject Cards */}
            <Card className="shadow-lg mb-8">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <BookOpen className="w-6 h-6" /> My Subjects
                </CardTitle>
                <CardDescription className="text-base">
                  {myAssignments.length} teaching assignments across batches & sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myAssignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No teaching assignments allocated yet.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6">
                    {myAssignments.map((a) => (
                      <Card
                        key={a.id}
                        className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                          selectedAssignmentId === a.id ? "border-2 border-primary shadow-md" : "border-2 border-transparent"
                        }`}
                        onClick={() => { setSelectedAssignmentId(a.id); setSelectedTest(""); setBulkMarks({}); }}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-2">{a.subject.code}</CardTitle>
                              <CardDescription className="text-sm leading-relaxed">{a.subject.name}</CardDescription>
                            </div>
                            <Badge variant={a.subject.type === "T" ? "default" : "secondary"} className="ml-2">
                              {a.subject.type === "T" ? "Theory" : "Lab"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Section:</span>
                            <span className="font-medium">{a.section?.name} ({a.batch?.name})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Semester:</span>
                            <span className="font-medium">Sem {a.semester}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Credits:</span>
                            <span className="font-medium">{a.subject.credits}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Students:</span>
                            <span className="font-semibold text-primary">{a.studentIds.length}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Marks Section */}
            {selected && (
              <Card className="shadow-lg border-primary">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Upload className="w-6 h-6" />
                    {selected.subject.code} — {selected.subject.name}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {selected.section?.name} • {selected.batch?.name} • Sem {selected.semester} •{" "}
                    {isTheory ? `Theory (CIE ${CIE_MAX_THEORY})` : `Lab (CIE ${CIE_MAX_LAB})`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                      <TabsTrigger value="upload" className="text-base">
                        <Upload className="w-4 h-4 mr-2" /> Upload Marks
                      </TabsTrigger>
                      <TabsTrigger value="view" className="text-base">
                        <Eye className="w-4 h-4 mr-2" /> View Subject-Wise Marks
                      </TabsTrigger>
                    </TabsList>

                    {/* Upload */}
                    <TabsContent value="upload" className="space-y-6 mt-8">
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Select Assessment</Label>
                        <Select value={selectedTest} onValueChange={setSelectedTest}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Choose an assessment" />
                          </SelectTrigger>
                          <SelectContent>
                            {getTestOptions().map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-base">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTest && (
                        <div className="space-y-6">
                          <div className="bg-primary/10 p-5 rounded-lg border border-primary/20">
                            <h3 className="font-semibold text-lg mb-1">
                              {getTestOptions().find((t) => t.value === selectedTest)?.label}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Existing values are pre-filled. Edit and save to update student CIE.
                            </p>
                          </div>

                          <div className="border rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-muted px-6 py-3 grid grid-cols-12 gap-4 font-semibold text-sm">
                              <div className="col-span-3">Roll Number</div>
                              <div className="col-span-6">Student Name</div>
                              <div className="col-span-3">Marks</div>
                            </div>
                            <div className="divide-y max-h-[480px] overflow-y-auto">
                              {classStudents.map((st) => {
                                const stored = (() => {
                                  const m = store.marks[`${selected.id}|${st.id}`] || {};
                                  if (selectedTest.startsWith("sliptest")) return m.slipTests?.[parseInt(selectedTest.replace("sliptest", ""), 10) - 1];
                                  if (selectedTest.startsWith("assignment")) return m.assignments?.[parseInt(selectedTest.replace("assignment", ""), 10) - 1];
                                  if (selectedTest.startsWith("classtest")) return m.classTests?.[parseInt(selectedTest.replace("classtest", ""), 10) - 1];
                                  if (selectedTest === "attendance") return m.attendance;
                                  if (selectedTest.startsWith("weeklycie")) return m.weeklyCIE?.[parseInt(selectedTest.replace("weeklycie", ""), 10) - 1];
                                  if (selectedTest.startsWith("internaltest")) return m.internalTests?.[parseInt(selectedTest.replace("internaltest", ""), 10) - 1];
                                  return "";
                                })();
                                const value = bulkMarks[st.id] !== undefined ? bulkMarks[st.id] : stored ?? "";
                                return (
                                  <div key={st.id} className="px-6 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/50 transition-colors text-sm">
                                    <div className="col-span-3 font-mono">{st.rollNumber}</div>
                                    <div className="col-span-6">{st.name}</div>
                                    <div className="col-span-3">
                                      <Input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max={getTestOptions().find((t) => t.value === selectedTest)?.max}
                                        placeholder="0"
                                        value={value}
                                        onChange={(e) => handleBulkMarkChange(st.id, e.target.value)}
                                        className="max-w-[120px] h-10"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <Button
                            onClick={handleSubmitBulkMarks}
                            className="w-full bg-gradient-primary hover:opacity-90 h-12 text-base"
                            size="lg"
                          >
                            <Upload className="w-5 h-5 mr-2" />
                            Save Marks for All Students
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* View Subject-Wise Marks */}
                    <TabsContent value="view" className="space-y-4 mt-8">
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted">
                              <TableHead className="w-[40px]">#</TableHead>
                              <TableHead>Roll Number</TableHead>
                              <TableHead>Name</TableHead>
                              {isTheory ? (
                                <>
                                  <TableHead className="text-center">Slip Tests<br /><span className="text-xs font-normal">(avg/5)</span></TableHead>
                                  <TableHead className="text-center">Assignments<br /><span className="text-xs font-normal">(avg/10)</span></TableHead>
                                  <TableHead className="text-center">Class Tests<br /><span className="text-xs font-normal">(avg/20)</span></TableHead>
                                  <TableHead className="text-center">Attendance<br /><span className="text-xs font-normal">(/5)</span></TableHead>
                                </>
                              ) : (
                                <>
                                  <TableHead className="text-center">Weekly CIE<br /><span className="text-xs font-normal">(/90)</span></TableHead>
                                  <TableHead className="text-center">Internal Tests<br /><span className="text-xs font-normal">(/40)</span></TableHead>
                                </>
                              )}
                              <TableHead className="text-center bg-primary/10 font-bold">
                                Final CIE<br /><span className="text-xs font-normal">/{isTheory ? CIE_MAX_THEORY : CIE_MAX_LAB}</span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subjectWise.map((row, idx) => (
                              <TableRow key={row.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                                <TableCell className="text-center">{idx + 1}</TableCell>
                                <TableCell className="font-mono text-xs">{row.rollNumber}</TableCell>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                {isTheory ? (
                                  <>
                                    <TableCell className="text-center">
                                      <div className="font-semibold">{row.slipTest}</div>
                                      <div className="text-xs text-muted-foreground">{row.slipTests.join(", ")}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold">{row.assignment}</div>
                                      <div className="text-xs text-muted-foreground">{row.assignments.join(", ")}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold">{row.classTest}</div>
                                      <div className="text-xs text-muted-foreground">{row.classTests.join(", ")}</div>
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">{row.attendance}</TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell className="text-center">
                                      <div className="font-semibold">{row.weeklyCIE}</div>
                                      <div className="text-xs text-muted-foreground">{row.weeklies.join(", ")}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="font-semibold">{row.internalTests}</div>
                                      <div className="text-xs text-muted-foreground">{row.internals.join(", ")}</div>
                                    </TableCell>
                                  </>
                                )}
                                <TableCell className={`text-center bg-primary/5 font-bold text-base ${
                                  row.total / row.max < 0.4 ? "text-destructive" : row.total / row.max >= 0.9 ? "text-emerald-600" : "text-primary"
                                }`}>
                                  {row.total}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        These CIE values are mirrored in the student's dashboard and the Department's section marks view.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <FacultyAnalytics subjects={analyticsSubjects} />
          </TabsContent>

          <TabsContent value="risk">
            <RiskAssessment />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FacultyDashboard;
