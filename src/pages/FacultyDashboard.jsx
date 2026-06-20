import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, BookOpen, Brain, LogOut, Plus } from "lucide-react";
import RiskAssessment from "@/components/faculty/RiskAssessment";
import AddTeachingAssignment from "@/components/faculty/AddTeachingAssignment";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getStore,
  getAssignmentsForFaculty,
  DEFAULT_FACULTY_ID,
} from "@/lib/dataStore";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyId, store, refreshTick]);

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

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary via-primary/80 to-accent text-primary-foreground shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Faculty Portal</h1>
                <p className="text-xs sm:text-sm opacity-80 truncate">{me?.name} • {me?.designation}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/faculty/settings")}
                className="sm:hidden text-primary-foreground hover:bg-white/10 border border-white/20"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="sm:hidden text-primary-foreground hover:bg-white/10 border border-white/20"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/faculty/settings")}
                className="hidden sm:inline-flex gap-2 text-primary-foreground hover:bg-white/10 border border-white/20"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="hidden sm:inline-flex gap-2 text-primary-foreground hover:bg-white/10 border border-white/20"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto sm:h-12 mb-6 sm:mb-8">
            <TabsTrigger value="subjects" className="text-xs sm:text-base py-2 px-1 sm:px-3">
              <BookOpen className="w-4 h-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">Subjects & Marks</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-xs sm:text-base py-2 px-1 sm:px-3">
              <Brain className="w-4 h-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">Performance & Risk</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            {/* Subject Cards */}
            <Card className="shadow-lg mb-8">
              <CardHeader className="pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <BookOpen className="w-6 h-6" /> My Subjects
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {myAssignments.length} teaching assignments across batches & sections
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setAddOpen(true)}
                    className="shrink-0 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </Button>
                </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {displayedAssignments.map((a) => (
                          <Card
                            key={a.id}
                            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 border-2 border-transparent"
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
                                <span className="text-muted-foreground">{a.isElective ? "Type:" : "Section:"}</span>
                                <span className="font-medium">
                                  {a.isElective
                                    ? "Elective"
                                    : `${a.section?.name || "—"}${a.batch ? ` (${a.batch.name})` : ""}`}
                                </span>
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
      <AddTeachingAssignment
        open={addOpen}
        onOpenChange={setAddOpen}
        facultyId={facultyId}
        onAdded={() => setRefreshTick((t) => t + 1)}
      />
    </div>
  );
};

export default FacultyDashboard;
