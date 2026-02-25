import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Settings } from "lucide-react";
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

  if (!department) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{department.name}</h1>
                <p className="text-sm text-muted-foreground">{department.abbreviation}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(`/admin/department/${id}/settings`)} className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
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
