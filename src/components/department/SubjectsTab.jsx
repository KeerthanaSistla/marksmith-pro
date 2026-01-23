import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, Pencil, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialSemesters = [
  {
    id: 1,
    name: "Semester 1",
    subjects: [
      { id: 1, code: "CS101", name: "Introduction to Programming", abbreviation: "ITP" },
      { id: 2, code: "MA101", name: "Engineering Mathematics I", abbreviation: "EM1" },
    ],
  },
  {
    id: 2,
    name: "Semester 2",
    subjects: [
      { id: 3, code: "CS102", name: "Data Structures", abbreviation: "DS" },
      { id: 4, code: "MA102", name: "Engineering Mathematics II", abbreviation: "EM2" },
    ],
  },
];

const SubjectsTab = ({ departmentId }) => {
  const [semesters, setSemesters] = useState(initialSemesters);
  const [showAddSemesterDialog, setShowAddSemesterDialog] = useState(false);
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectAbbr, setNewSubjectAbbr] = useState("");
  const [openSemesters, setOpenSemesters] = useState({});
  const { toast } = useToast();

  const toggleSemester = (semId) => {
    setOpenSemesters((prev) => ({
      ...prev,
      [semId]: !prev[semId],
    }));
  };

  const handleAddSemester = () => {
    if (!newSemesterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a semester name",
        variant: "destructive",
      });
      return;
    }

    const newSem = {
      id: Date.now(),
      name: newSemesterName.trim(),
      subjects: [],
    };

    setSemesters([...semesters, newSem]);
    setNewSemesterName("");
    setShowAddSemesterDialog(false);
    setOpenSemesters((prev) => ({ ...prev, [newSem.id]: true }));

    toast({
      title: "Success",
      description: `${newSem.name} added successfully`,
    });
  };

  const handleAddSubject = () => {
    if (!newSubjectCode.trim() || !newSubjectName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    const newSubject = {
      id: Date.now(),
      code: newSubjectCode.trim(),
      name: newSubjectName.trim(),
      abbreviation: newSubjectAbbr.trim() || newSubjectCode.trim(),
    };

    setSemesters(
      semesters.map((sem) =>
        sem.id === selectedSemester.id
          ? { ...sem, subjects: [...sem.subjects, newSubject] }
          : sem
      )
    );

    resetSubjectForm();
    setShowAddSubjectDialog(false);

    toast({
      title: "Success",
      description: "Subject added successfully",
    });
  };

  const handleEditSubject = () => {
    if (!newSubjectCode.trim() || !newSubjectName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setSemesters(
      semesters.map((sem) =>
        sem.id === selectedSemester.id
          ? {
              ...sem,
              subjects: sem.subjects.map((sub) =>
                sub.id === editingSubject.id
                  ? {
                      ...sub,
                      code: newSubjectCode.trim(),
                      name: newSubjectName.trim(),
                      abbreviation: newSubjectAbbr.trim() || newSubjectCode.trim(),
                    }
                  : sub
              ),
            }
          : sem
      )
    );

    resetSubjectForm();
    setShowEditSubjectDialog(false);

    toast({
      title: "Success",
      description: "Subject updated successfully",
    });
  };

  const handleDeleteSubject = (semId, subId) => {
    setSemesters(
      semesters.map((sem) =>
        sem.id === semId
          ? { ...sem, subjects: sem.subjects.filter((sub) => sub.id !== subId) }
          : sem
      )
    );

    toast({
      title: "Deleted",
      description: "Subject removed",
    });
  };

  const openAddSubjectDialog = (sem) => {
    setSelectedSemester(sem);
    setShowAddSubjectDialog(true);
  };

  const openEditSubjectDialog = (sem, subject) => {
    setSelectedSemester(sem);
    setEditingSubject(subject);
    setNewSubjectCode(subject.code);
    setNewSubjectName(subject.name);
    setNewSubjectAbbr(subject.abbreviation);
    setShowEditSubjectDialog(true);
  };

  const resetSubjectForm = () => {
    setNewSubjectCode("");
    setNewSubjectName("");
    setNewSubjectAbbr("");
    setEditingSubject(null);
    setSelectedSemester(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Semester Button */}
      <Button onClick={() => setShowAddSemesterDialog(true)} className="gap-2 bg-gradient-primary hover:opacity-90">
        <Plus className="w-4 h-4" />
        Add Semester
      </Button>

      {/* Semesters */}
      <div className="space-y-4">
        {semesters.map((sem) => (
          <Card key={sem.id}>
            <Collapsible open={openSemesters[sem.id]} onOpenChange={() => toggleSemester(sem.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-primary flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {sem.name}
                      <span className="text-sm text-muted-foreground font-normal">
                        ({sem.subjects.length} subjects)
                      </span>
                    </CardTitle>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        openSemesters[sem.id] ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {sem.subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {subject.code} - {subject.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Abbreviation: {subject.abbreviation}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditSubjectDialog(sem, subject)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubject(sem.id, subject.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {sem.subjects.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No subjects added yet
                      </p>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => openAddSubjectDialog(sem)}
                      className="w-full gap-2 mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Subject
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        {semesters.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No semesters added yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Semester Dialog */}
      <Dialog open={showAddSemesterDialog} onOpenChange={setShowAddSemesterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Semester</DialogTitle>
            <DialogDescription>Create a new semester section</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="semesterName">Semester Name</Label>
              <Input
                id="semesterName"
                placeholder="e.g., Semester 3"
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSemesterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSemester} className="bg-gradient-primary hover:opacity-90">
              Add Semester
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subject Dialog */}
      <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject to {selectedSemester?.name}</DialogTitle>
            <DialogDescription>Enter subject details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subjectCode">Subject Code *</Label>
              <Input
                id="subjectCode"
                placeholder="e.g., CS201"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name *</Label>
              <Input
                id="subjectName"
                placeholder="e.g., Object Oriented Programming"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectAbbr">Abbreviation (Optional)</Label>
              <Input
                id="subjectAbbr"
                placeholder="e.g., OOP"
                value={newSubjectAbbr}
                onChange={(e) => setNewSubjectAbbr(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddSubjectDialog(false); resetSubjectForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddSubject} className="bg-gradient-primary hover:opacity-90">
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={showEditSubjectDialog} onOpenChange={setShowEditSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update subject details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSubjectCode">Subject Code *</Label>
              <Input
                id="editSubjectCode"
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSubjectName">Subject Name *</Label>
              <Input
                id="editSubjectName"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSubjectAbbr">Abbreviation</Label>
              <Input
                id="editSubjectAbbr"
                value={newSubjectAbbr}
                onChange={(e) => setNewSubjectAbbr(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditSubjectDialog(false); resetSubjectForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditSubject} className="bg-gradient-primary hover:opacity-90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectsTab;
