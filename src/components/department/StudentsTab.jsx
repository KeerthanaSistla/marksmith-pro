import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Upload, Pencil, Trash2, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialSections = [
  {
    id: 1,
    name: "IT1",
    students: [
      { id: 1, rollNumber: "IT101", name: "Alice Johnson" },
      { id: 2, rollNumber: "IT102", name: "Bob Smith" },
      { id: 3, rollNumber: "IT103", name: "Charlie Brown" },
    ],
  },
  {
    id: 2,
    name: "IT2",
    students: [
      { id: 4, rollNumber: "IT201", name: "Diana Ross" },
      { id: 5, rollNumber: "IT202", name: "Edward Norton" },
    ],
  },
];

const StudentsTab = ({ departmentId }) => {
  const [sections, setSections] = useState(initialSections);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a section name",
        variant: "destructive",
      });
      return;
    }

    const newSection = {
      id: Date.now(),
      name: newSectionName.trim(),
      students: [],
    };

    setSections([...sections, newSection]);
    setNewSectionName("");
    setShowAddSectionDialog(false);

    toast({
      title: "Success",
      description: `Section ${newSection.name} added successfully`,
    });
  };

  const handleAddStudent = () => {
    if (!newStudentRoll.trim() || !newStudentName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newStudent = {
      id: Date.now(),
      rollNumber: newStudentRoll.trim(),
      name: newStudentName.trim(),
    };

    setSections(
      sections.map((sec) =>
        sec.id === selectedSection.id
          ? {
              ...sec,
              students: [...sec.students, newStudent].sort((a, b) =>
                a.rollNumber.localeCompare(b.rollNumber)
              ),
            }
          : sec
      )
    );

    // Update selected section state
    setSelectedSection((prev) => ({
      ...prev,
      students: [...prev.students, newStudent].sort((a, b) =>
        a.rollNumber.localeCompare(b.rollNumber)
      ),
    }));

    resetStudentForm();
    setShowAddStudentDialog(false);

    toast({
      title: "Success",
      description: "Student added successfully",
    });
  };

  const handleEditStudent = () => {
    if (!newStudentRoll.trim() || !newStudentName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const updatedSections = sections.map((sec) =>
      sec.id === selectedSection.id
        ? {
            ...sec,
            students: sec.students
              .map((stu) =>
                stu.id === editingStudent.id
                  ? { ...stu, rollNumber: newStudentRoll.trim(), name: newStudentName.trim() }
                  : stu
              )
              .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber)),
          }
        : sec
    );

    setSections(updatedSections);
    setSelectedSection(updatedSections.find((s) => s.id === selectedSection.id));

    resetStudentForm();
    setShowEditStudentDialog(false);

    toast({
      title: "Success",
      description: "Student updated successfully",
    });
  };

  const handleDeleteStudent = (studentId) => {
    const updatedSections = sections.map((sec) =>
      sec.id === selectedSection.id
        ? { ...sec, students: sec.students.filter((stu) => stu.id !== studentId) }
        : sec
    );

    setSections(updatedSections);
    setSelectedSection(updatedSections.find((s) => s.id === selectedSection.id));

    toast({
      title: "Deleted",
      description: "Student removed",
    });
  };

  const openEditStudentDialog = (student) => {
    setEditingStudent(student);
    setNewStudentRoll(student.rollNumber);
    setNewStudentName(student.name);
    setShowEditStudentDialog(true);
  };

  const resetStudentForm = () => {
    setNewStudentRoll("");
    setNewStudentName("");
    setEditingStudent(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const lines = text.split("\n").filter((line) => line.trim());
        const headers = lines[0].toLowerCase();

        if (!headers.includes("roll") || !headers.includes("name")) {
          toast({
            title: "Invalid File",
            description: "CSV must have columns: Roll Number, Name",
            variant: "destructive",
          });
          return;
        }

        const newStudents = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values.length >= 2 && values[0] && values[1]) {
            newStudents.push({
              id: Date.now() + i,
              rollNumber: values[0],
              name: values[1],
            });
          }
        }

        if (newStudents.length > 0) {
          const updatedSections = sections.map((sec) =>
            sec.id === selectedSection.id
              ? {
                  ...sec,
                  students: [...sec.students, ...newStudents].sort((a, b) =>
                    a.rollNumber.localeCompare(b.rollNumber)
                  ),
                }
              : sec
          );

          setSections(updatedSections);
          setSelectedSection(updatedSections.find((s) => s.id === selectedSection.id));

          toast({
            title: "Success",
            description: `${newStudents.length} students imported`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Section List View
  if (!selectedSection) {
    return (
      <div className="space-y-6">
        <Button onClick={() => setShowAddSectionDialog(true)} className="gap-2 bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4" />
          Add Section
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
              onClick={() => setSelectedSection(section)}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
                  <Users className="w-7 h-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{section.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {section.students.length} students
                </p>
              </CardHeader>
            </Card>
          ))}

          {/* Add Section Card */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-dashed border-muted-foreground/30 hover:border-accent"
            onClick={() => setShowAddSectionDialog(true)}
          >
            <CardHeader className="text-center h-full flex flex-col items-center justify-center">
              <div className="mx-auto w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-2">
                <Plus className="w-7 h-7 text-accent" />
              </div>
              <CardTitle className="text-lg text-accent">Add Section</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Add Section Dialog */}
        <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Section</DialogTitle>
              <DialogDescription>Create a new student section</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sectionName">Section Name</Label>
                <Input
                  id="sectionName"
                  placeholder="e.g., IT3"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSectionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSection} className="bg-gradient-primary hover:opacity-90">
                Add Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Student List View
  return (
    <div className="space-y-6">
      {/* Back Button and Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => setSelectedSection(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Sections
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setShowAddStudentDialog(true)} className="gap-2 bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="w-4 h-4" />
          Bulk Upload (CSV)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Section Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            {selectedSection.name} - Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSection.students.length > 0 ? (
            <div className="space-y-2">
              {selectedSection.students.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-8">{index + 1}.</span>
                    <div>
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">Roll: {student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditStudentDialog(student)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStudent(student.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No students in this section yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to {selectedSection.name}</DialogTitle>
            <DialogDescription>Enter student details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentRoll">Roll Number</Label>
              <Input
                id="studentRoll"
                placeholder="e.g., IT301"
                value={newStudentRoll}
                onChange={(e) => setNewStudentRoll(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentName">Name</Label>
              <Input
                id="studentName"
                placeholder="e.g., John Doe"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddStudentDialog(false); resetStudentForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} className="bg-gradient-primary hover:opacity-90">
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditStudentDialog} onOpenChange={setShowEditStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editStudentRoll">Roll Number</Label>
              <Input
                id="editStudentRoll"
                value={newStudentRoll}
                onChange={(e) => setNewStudentRoll(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStudentName">Name</Label>
              <Input
                id="editStudentName"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditStudentDialog(false); resetStudentForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditStudent} className="bg-gradient-primary hover:opacity-90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsTab;
