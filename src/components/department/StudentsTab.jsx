import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Pencil, Trash2, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialBatches = [
  {
    id: 1,
    name: "2023-2027",
    startYear: 2023,
    endYear: 2027,
    sections: [
      {
        id: 1, name: "IT1", year: 3, semester: 6,
        students: [
          { id: 1, rollNumber: "160123737071", name: "AMETI AKSHITHA" },
          { id: 2, rollNumber: "160123737072", name: "HAMSAGOUNI RITHIKA" },
          { id: 3, rollNumber: "160123737073", name: "KANDIMALLA SONY" },
          { id: 4, rollNumber: "160123737074", name: "LAKSHANA.S" },
          { id: 5, rollNumber: "160123737075", name: "MEGHANA" },
          { id: 6, rollNumber: "160123737076", name: "MEHERUNNISA" },
          { id: 7, rollNumber: "160123737077", name: "NIMMALA MADHURI" },
        ],
      },
      {
        id: 2, name: "IT2", year: 3, semester: 6,
        students: [
          { id: 8, rollNumber: "160123737078", name: "PRIYA SHARMA" },
          { id: 9, rollNumber: "160123737079", name: "RAHUL KUMAR" },
        ],
      },
      {
        id: 3, name: "IT3", year: 3, semester: 6,
        students: [
          { id: 10, rollNumber: "160123737080", name: "SNEHA REDDY" },
        ],
      },
    ],
  },
];

const StudentsTab = ({ departmentId }) => {
  const [batches, setBatches] = useState(initialBatches);
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id?.toString() || "");
  const [selectedSection, setSelectedSection] = useState(null);

  const [showAddBatchDialog, setShowAddBatchDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);
  const [newBatchStart, setNewBatchStart] = useState("");
  const [newBatchEnd, setNewBatchEnd] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const selectedBatch = batches.find((b) => b.id.toString() === selectedBatchId);

  // ── Batch CRUD ──
  const handleAddBatch = () => {
    const start = parseInt(newBatchStart);
    const end = parseInt(newBatchEnd);
    if (!start || !end || end <= start) {
      toast({ title: "Error", description: "Please enter valid start and end years", variant: "destructive" });
      return;
    }
    const newBatch = { id: Date.now(), name: `${start}-${end}`, startYear: start, endYear: end, sections: [] };
    setBatches([...batches, newBatch]);
    setSelectedBatchId(newBatch.id.toString());
    setNewBatchStart("");
    setNewBatchEnd("");
    setShowAddBatchDialog(false);
    toast({ title: "Success", description: `Batch ${start}-${end} added` });
  };

  // ── Section CRUD ──
  const handleAddSection = () => {
    if (!newSectionName.trim() || !selectedBatch) {
      toast({ title: "Error", description: "Please enter a section name", variant: "destructive" });
      return;
    }
    const newSection = { id: Date.now(), name: newSectionName.trim(), year: 3, semester: 6, students: [] };
    const updated = batches.map((b) =>
      b.id === selectedBatch.id ? { ...b, sections: [...b.sections, newSection] } : b
    );
    setBatches(updated);
    setNewSectionName("");
    setShowAddSectionDialog(false);
    toast({ title: "Success", description: `Section ${newSection.name} added` });
  };

  // ── Student helpers ──
  const updateSectionStudents = (updaterFn) => {
    if (!selectedBatch || !selectedSection) return;
    const updated = batches.map((b) =>
      b.id === selectedBatch.id
        ? {
            ...b,
            sections: b.sections.map((sec) =>
              sec.id === selectedSection.id ? { ...sec, students: updaterFn(sec.students) } : sec
            ),
          }
        : b
    );
    setBatches(updated);
    const batchRef = updated.find((b) => b.id === selectedBatch.id);
    const sectionRef = batchRef?.sections.find((s) => s.id === selectedSection.id);
    setSelectedSection(sectionRef || null);
  };

  const handleAddStudent = () => {
    if (!newStudentRoll.trim() || !newStudentName.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const newStudent = { id: Date.now(), rollNumber: newStudentRoll.trim(), name: newStudentName.trim() };
    updateSectionStudents((students) =>
      [...students, newStudent].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
    );
    setNewStudentRoll("");
    setNewStudentName("");
    setShowAddStudentDialog(false);
    toast({ title: "Success", description: "Student added" });
  };

  const handleEditStudent = () => {
    if (!newStudentRoll.trim() || !newStudentName.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    updateSectionStudents((students) =>
      students
        .map((s) =>
          s.id === editingStudent.id ? { ...s, rollNumber: newStudentRoll.trim(), name: newStudentName.trim() } : s
        )
        .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
    );
    setNewStudentRoll("");
    setNewStudentName("");
    setEditingStudent(null);
    setShowEditStudentDialog(false);
    toast({ title: "Success", description: "Student updated" });
  };

  const handleDeleteStudent = (studentId) => {
    updateSectionStudents((students) => students.filter((s) => s.id !== studentId));
    toast({ title: "Deleted", description: "Student removed" });
  };

  const handleDeleteSection = (sectionId) => {
    if (!selectedBatch) return;
    if (!confirm("Are you sure you want to delete this section and all its students?")) return;
    const updated = batches.map((b) =>
      b.id === selectedBatch.id
        ? { ...b, sections: b.sections.filter((s) => s.id !== sectionId) }
        : b
    );
    setBatches(updated);
    if (selectedSection?.id === sectionId) setSelectedSection(null);
    toast({ title: "Deleted", description: "Section removed" });
  };

  const handleDeleteBatch = () => {
    if (!selectedBatch) return;
    if (!confirm("Delete this batch and all its sections/students?")) return;
    setBatches(batches.filter((b) => b.id !== selectedBatch.id));
    setSelectedBatchId("");
    setSelectedSection(null);
    toast({ title: "Deleted", description: "Batch removed" });
  };

  const openEditStudentDialog = (student) => {
    setEditingStudent(student);
    setNewStudentRoll(student.rollNumber);
    setNewStudentName(student.name);
    setShowEditStudentDialog(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const lines = text.split("\n").filter((l) => l.trim());
        const newStudents = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(",").map((v) => v.trim());
          if (vals.length >= 2 && vals[0] && vals[1]) {
            newStudents.push({ id: Date.now() + i, rollNumber: vals[0], name: vals[1] });
          }
        }
        if (newStudents.length > 0) {
          updateSectionStudents((students) =>
            [...students, ...newStudents].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
          );
          toast({ title: "Success", description: `${newStudents.length} students imported` });
        }
      } catch {
        toast({ title: "Error", description: "Failed to parse file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
    setShowBulkUploadDialog(false);
  };

  // Filtered & paginated students
  const filteredStudents = selectedSection?.students?.filter(
    (s) =>
      s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.rollNumber || "").localeCompare(b.rollNumber || "")) || [];

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  // Get current batch sections
  const currentSections = selectedBatch?.sections || [];

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />

      {/* Batch Selector Row */}
      <div className="flex items-center gap-3">
        <Select value={selectedBatchId} onValueChange={(v) => { setSelectedBatchId(v); setSelectedSection(null); setSearchQuery(""); setCurrentPage(1); }}>
          <SelectTrigger className="flex-1 bg-primary/5 border-primary/20">
            <SelectValue placeholder="Select a batch" />
          </SelectTrigger>
          <SelectContent>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id.toString()}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddBatchDialog(true)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="w-4 h-4" /> Add Batch
        </Button>
      </div>

      {/* Sections Header */}
      {selectedBatch && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Student Sections</h3>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddSectionDialog(true)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4" /> Add Section
              </Button>
              <Button variant="outline" onClick={handleDeleteBatch} className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>

          {/* Section Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSections.map((section) => (
              <Card
                key={section.id}
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedSection?.id === section.id
                    ? "border-primary shadow-md"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => { setSelectedSection(section); setSearchQuery(""); setCurrentPage(1); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <h4 className="text-xl font-bold text-foreground">{section.name}</h4>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-6 mt-2 text-sm">
                    <span className="text-primary font-medium">Year {section.year}</span>
                    <span className="text-primary font-medium">Semester {section.semester}</span>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">Students</div>
                  <div className="text-lg font-semibold text-foreground">{section.students?.length || 0}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!selectedBatch && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Select a batch from the dropdown above to view sections.</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Section — Student List */}
      {selectedSection && (
        <Card className="mt-4">
          <CardContent className="p-6">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-xl font-bold text-foreground">{selectedSection.name}</h3>
                <span className="text-sm bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                  {selectedSection.students?.length || 0} Students
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)} className="gap-2">
                  <Upload className="w-4 h-4" /> Bulk Upload
                </Button>
                <Button onClick={() => setShowAddStudentDialog(true)} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="w-4 h-4" /> Add Student
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteSection(selectedSection.id)}
                  className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Batch: {selectedBatch?.name} • Year {selectedSection.year} • Semester {selectedSection.semester}
            </p>

            <hr className="mb-4 border-border" />

            {/* Search & Student Count */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-foreground">
                Student ({selectedSection.students?.length || 0})
              </h4>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by roll number or name..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Student Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Roll Number</TableHead>
                  <TableHead className="w-[45%]">Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-muted-foreground">{student.rollNumber}</TableCell>
                      <TableCell className="font-semibold text-foreground">{student.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditStudentDialog(student)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      {searchQuery ? "No students match your search" : "No students in this section yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * studentsPerPage + 1}-{Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Batch Dialog */}
      <Dialog open={showAddBatchDialog} onOpenChange={setShowAddBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
            <DialogDescription>Create a new student batch (e.g., 2023-2027)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Start Year</Label>
              <Input placeholder="e.g., 2023" value={newBatchStart} onChange={(e) => setNewBatchStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Year</Label>
              <Input placeholder="e.g., 2027" value={newBatchEnd} onChange={(e) => setNewBatchEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBatchDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBatch} className="bg-accent hover:bg-accent/90 text-accent-foreground">Create Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>Create a new student section (e.g., IT1, IT2)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input placeholder="e.g., IT1" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSectionDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSection} className="bg-accent hover:bg-accent/90 text-accent-foreground">Add Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to {selectedSection?.name}</DialogTitle>
            <DialogDescription>Enter student details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Roll Number *</Label>
              <Input placeholder="e.g., 160123737001" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="e.g., Sistla Keerthana" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddStudentDialog(false); setNewStudentRoll(""); setNewStudentName(""); }}>Cancel</Button>
            <Button onClick={handleAddStudent} className="bg-accent hover:bg-accent/90 text-accent-foreground">Add Student</Button>
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
              <Label>Roll Number</Label>
              <Input value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditStudentDialog(false); setEditingStudent(null); }}>Cancel</Button>
            <Button onClick={handleEditStudent} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Students to {selectedSection?.name}</DialogTitle>
            <DialogDescription>Upload a CSV file with columns: Roll Number, Name</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsTab;
