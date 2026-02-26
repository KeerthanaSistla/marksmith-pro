import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Users, BookOpen, Upload, Eye, Plus } from "lucide-react";
import AddTeachingAssignment from "@/components/faculty/AddTeachingAssignment";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for faculty subjects
const mockFacultyData = {
  name: "Dr. Robert Smith",
  subjects: [
    {
      id: "sub1",
      courseCode: "22CSC21",
      name: "Software Engineering",
      type: "theory",
      credits: 3,
      class: "CSE-3A",
      students: 60,
    },
    {
      id: "sub2",
      courseCode: "22CSC23",
      name: "CASE Tools Lab",
      type: "lab",
      credits: 1,
      class: "CSE-3A",
      students: 60,
    },
    {
      id: "sub3",
      courseCode: "22ITC08",
      name: "Computer Networks",
      type: "theory",
      credits: 3,
      class: "CSE-3B",
      students: 58,
    },
  ],
};

// Mock student data
const mockStudents = [
  { id: "s1", name: "Alice Johnson", rollNo: "CSE-3A-001", class: "CSE-3A" },
  { id: "s2", name: "Bob Williams", rollNo: "CSE-3A-002", class: "CSE-3A" },
  { id: "s3", name: "Carol Davis", rollNo: "CSE-3A-003", class: "CSE-3A" },
  { id: "s4", name: "David Miller", rollNo: "CSE-3A-004", class: "CSE-3A" },
  { id: "s5", name: "Emma Wilson", rollNo: "CSE-3A-005", class: "CSE-3A" },
];

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTest, setSelectedTest] = useState("");
  const [bulkMarks, setBulkMarks] = useState({});
  const [weekCount, setWeekCount] = useState(3);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [teachingAssignments, setTeachingAssignments] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const getTestOptions = () => {
    if (!selectedSubject) return [];
    
    if (selectedSubject.type === "theory") {
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
    } else {
      const weekOptions = [];
      for (let i = 1; i <= weekCount; i++) {
        weekOptions.push({ value: `weeklycie${i}`, label: `Weekly CIE ${i} (Max 30)`, max: 30 });
      }
      weekOptions.push(
        { value: "internaltest1", label: "Internal Test 1 (Max 20)", max: 20 },
        { value: "internaltest2", label: "Internal Test 2 (Max 20)", max: 20 }
      );
      return weekOptions;
    }
  };

  const handleAddWeek = () => {
    setWeekCount(prev => prev + 1);
    toast({
      title: "Week Added",
      description: `Week ${weekCount + 1} has been added to the assessment list`,
    });
  };

  const handleBulkMarkChange = (studentId, value) => {
    setBulkMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSubmitBulkMarks = () => {
    if (!selectedTest) {
      toast({
        title: "Error",
        description: "Please select a test",
        variant: "destructive",
      });
      return;
    }

    const submittedCount = Object.keys(bulkMarks).filter(key => bulkMarks[key]).length;
    
    toast({
      title: "Marks Uploaded Successfully",
      description: `${selectedTest.toUpperCase()} marks uploaded for ${submittedCount} students`,
    });

    setBulkMarks({});
    setSelectedTest("");
  };

  const getClassStudents = () => {
    if (!selectedSubject) return [];
    return mockStudents.filter(s => s.class === selectedSubject.class);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-accent text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">Faculty Portal</h1>
                <p className="text-white/90">{mockFacultyData.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="text-white border-white hover:bg-white/20" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
              <Button variant="outline" className="text-white border-white hover:bg-white/20" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Subjects Overview */}
        <Card className="shadow-lg mb-8">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <BookOpen className="w-6 h-6" />
              My Subjects
            </CardTitle>
            <CardDescription className="text-base">Select a subject to upload marks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {mockFacultyData.subjects.map((subject) => (
                <Card
                  key={subject.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                    selectedSubject?.id === subject.id ? "border-2 border-primary shadow-md" : "border-2 border-transparent"
                  }`}
                  onClick={() => setSelectedSubject(subject)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{subject.courseCode}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">{subject.name}</CardDescription>
                      </div>
                      <Badge variant={subject.type === "theory" ? "default" : "secondary"} className="ml-2">
                        {subject.type === "theory" ? "Theory" : "Lab"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Class:</span>
                      <span className="font-medium">{subject.class}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credits:</span>
                      <span className="font-medium">{subject.credits}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-semibold text-primary">{subject.students}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Marks Upload/View Section */}
        {selectedSubject && (
          <Card className="shadow-lg border-primary">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Upload className="w-6 h-6" />
                Manage Marks - {selectedSubject.name}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {selectedSubject.courseCode} | {selectedSubject.class} | {selectedSubject.type === "theory" ? "Theory Subject (CIE: 40)" : "Lab Subject (CIE: 50)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="upload" className="text-base">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Marks
                  </TabsTrigger>
                  <TabsTrigger value="view" className="text-base">
                    <Eye className="w-4 h-4 mr-2" />
                    View Student-Wise
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6 mt-8">
                  {/* Lab Week Management */}
                  {selectedSubject.type === "lab" && (
                    <div className="bg-accent/10 p-5 rounded-lg border border-accent/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-base mb-1">Weekly CIE Management</h3>
                          <p className="text-sm text-muted-foreground">
                            Currently tracking {weekCount} weeks of lab assessments
                          </p>
                        </div>
                        <Button onClick={handleAddWeek} variant="outline" className="gap-2">
                          <Upload className="w-4 h-4" />
                          Add Week
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Test Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="test" className="text-base font-semibold">Select Test/Assessment</Label>
                    <Select value={selectedTest} onValueChange={setSelectedTest}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Choose a test to upload marks" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTestOptions().map(test => (
                          <SelectItem key={test.value} value={test.value} className="text-base">
                            {test.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk Upload Table */}
                  {selectedTest && (
                    <div className="space-y-6">
                      <div className="bg-primary/10 p-5 rounded-lg border border-primary/20">
                        <h3 className="font-semibold text-lg mb-2">
                          {getTestOptions().find(t => t.value === selectedTest)?.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Enter marks for all students below. Maximum marks: {getTestOptions().find(t => t.value === selectedTest)?.max}
                        </p>
                      </div>

                      <div className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-muted px-6 py-4 grid grid-cols-3 gap-6 font-semibold">
                          <div>Roll Number</div>
                          <div>Student Name</div>
                          <div>Marks</div>
                        </div>
                        <div className="divide-y">
                          {getClassStudents().map((student) => (
                            <div key={student.id} className="px-6 py-4 grid grid-cols-3 gap-6 items-center hover:bg-muted/50 transition-colors">
                              <div className="font-medium">{student.rollNo}</div>
                              <div>{student.name}</div>
                              <div>
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max={getTestOptions().find(t => t.value === selectedTest)?.max}
                                  placeholder="0"
                                  value={bulkMarks[student.id] || ""}
                                  onChange={(e) => handleBulkMarkChange(student.id, e.target.value)}
                                  className="max-w-[120px] h-11"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button 
                          onClick={handleSubmitBulkMarks} 
                          className="w-full bg-gradient-primary hover:opacity-90 h-12 text-base" 
                          size="lg"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Submit Marks for All Students
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="view" className="space-y-4 mt-8">
                  <div className="bg-muted/50 p-8 rounded-lg text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground text-base">
                      View detailed marks breakdown for individual students (coming soon)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default FacultyDashboard;
