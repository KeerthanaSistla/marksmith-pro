import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, BookOpen, Brain, Settings, LogOut } from "lucide-react";
import MarksTab from "@/components/student/MarksTab";
import AiZone from "@/components/student/AiZone";
import {
  buildStudentSemesterData, getDefaultStudentId, getStudent, getSection, getBatch,
} from "@/lib/dataStore";

const studentId = getDefaultStudentId();
const studentRecord = studentId ? getStudent(studentId) : null;
const studentSection = studentRecord ? getSection(studentRecord.sectionId) : null;
const studentBatch = studentRecord ? getBatch(studentRecord.batchId) : null;

// Find latest semester with subjects from initial seed
const initialData = studentId
  ? buildStudentSemesterData(studentId)
  : { 1: { subjects: [] } };
const latestSemester = Object.entries(initialData)
  .filter(([, d]) => d.subjects.length > 0)
  .map(([k]) => parseInt(k, 10))
  .sort((a, b) => b - a)[0] || (studentSection?.currentSemester || 1);

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary via-primary/80 to-accent text-primary-foreground shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Student Portal</h1>
                <p className="text-xs sm:text-sm opacity-80 truncate">
                  {studentRecord?.name || "Student"} • {studentRecord?.rollNumber || ""} • {studentSection?.name} ({studentBatch?.name})
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost" size="icon"
                onClick={() => navigate("/student/settings")}
                className="text-primary-foreground hover:bg-white/10 border border-white/20 sm:hidden"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/student/settings")}
                className="hidden sm:inline-flex gap-2 text-primary-foreground hover:bg-white/10 border border-white/20"
              >
                <Settings className="w-4 h-4" /> Settings
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => { localStorage.removeItem("userRole"); localStorage.removeItem("userEmail"); navigate("/"); }}
                className="text-primary-foreground hover:bg-white/10 border border-white/20 sm:hidden"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => { localStorage.removeItem("userRole"); localStorage.removeItem("userEmail"); navigate("/"); }}
                className="hidden sm:inline-flex gap-2 text-primary-foreground hover:bg-white/10 border border-white/20"
              >
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        <Tabs defaultValue="marks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto sm:h-12 mb-4 sm:mb-6">
            <TabsTrigger value="marks" className="text-sm sm:text-base">
              <BookOpen className="w-4 h-4 mr-2" /> Marks
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-sm sm:text-base">
              <Brain className="w-4 h-4 mr-2" /> AI Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marks">
            {studentId && <MarksTab studentId={studentId} latestSemester={latestSemester} />}
          </TabsContent>

          <TabsContent value="ai">
            <AiZone />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
