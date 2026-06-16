import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, BookOpen, Upload, Eye, Brain, LogOut } from "lucide-react";
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
          <TabsList className="grid w-full grid-cols-2 h-12 mb-8">
            <TabsTrigger value="subjects" className="text-base">
              <BookOpen className="w-4 h-4 mr-2" /> Subjects & Marks
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-base">
              <Brain className="w-4 h-4 mr-2" /> Performance & Risk
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
                  <>
                    {/* Academic Year Filter Tabs */}
                    {academicYears.length > 0 && (
                      <div className="mb-6">
                        <Tabs value={selectedAcademicYear} onValueChange={setSelectedAcademicYear} className="w-full">
                          <TabsList className="flex flex-wrap h-auto">
                            <TabsTrigger value="all" className="gap-1">
                              All Years
                              <Badge variant="secondary" className="ml-2">{myAssignments.length}</Badge>
                            </TabsTrigger>
                            {academicYears.map((year) => (
                              <TabsTrigger key={year} value={year} className="gap-1">
                                {year}
                                <Badge variant="secondary" className="ml-2">{subjectsByYear[year]?.length || 0}</Badge>
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>
                    )}

                    {displayedAssignments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No subjects taught in {selectedAcademicYear}.
                      </p>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-6">
                        {displayedAssignments.map((a) => (
                          <Card
                            key={a.id}
                            className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                              selectedAssignmentId === a.id ? "border-2 border-primary shadow-md" : "border-2 border-transparent"
                            }`}
                            onClick={() => navigate(`/faculty/subject/${a.id}`)}
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <CardTitle className="text-xl mb-2">{a.subject.code}</CardTitle>
                                  <CardDescription className="text-sm leading-relaxed">{a.subject.name}</CardDescription>
                                  {a.academicYear && (
                                    <Badge variant="outline" className="mt-2">
                                      {a.academicYear} • Sem {a.semester}
                                    </Badge>
                                  )}
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
                  </>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="risk">
            <RiskAssessment facultyId={facultyId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FacultyDashboard;
