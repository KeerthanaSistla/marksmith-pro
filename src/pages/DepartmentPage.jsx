import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Settings, LogOut } from "lucide-react";
import FacultyTab from "@/components/department/FacultyTab";
import SubjectsTab from "@/components/department/SubjectsTab";
import StudentsTab from "@/components/department/StudentsTab";

const DepartmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);

  useEffect(() => {
    const storedDept = localStorage.getItem("currentDepartment");
    if (storedDept) {
      setDepartment(JSON.parse(storedDept));
    } else {
      navigate("/admin");
    }
  }, [navigate]);

  const handleBack = () => {
    localStorage.removeItem("currentDepartment");
    navigate("/admin");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!department) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Header */}
      <header className="bg-gradient-to-r from-primary via-primary/80 to-accent text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack} className="text-primary-foreground hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{department.name}</h1>
                <p className="text-sm opacity-80">Department Code: {department.abbreviation}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate(`/admin/department/${id}/settings`)}
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

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
            <TabsTrigger value="faculty" className="text-base">Faculty</TabsTrigger>
            <TabsTrigger value="subjects" className="text-base">Subjects</TabsTrigger>
            <TabsTrigger value="students" className="text-base">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="faculty">
            <FacultyTab departmentId={department.id} />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectsTab departmentId={department.id} />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab departmentId={department.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DepartmentPage;
