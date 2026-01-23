import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Pencil, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const designations = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Lab Instructor",
];

const initialFaculty = [
  { id: 1, facultyId: "FAC001", name: "Dr. John Smith", designation: "Professor" },
  { id: 2, facultyId: "FAC002", name: "Dr. Sarah Johnson", designation: "Professor" },
  { id: 3, facultyId: "FAC003", name: "Mr. Michael Brown", designation: "Associate Professor" },
  { id: 4, facultyId: "FAC004", name: "Ms. Emily Davis", designation: "Assistant Professor" },
  { id: 5, facultyId: "FAC005", name: "Mr. Robert Wilson", designation: "Lecturer" },
  { id: 6, facultyId: "FAC006", name: "Ms. Jennifer Lee", designation: "Lab Instructor" },
];

const FacultyTab = ({ departmentId }) => {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [newFacultyId, setNewFacultyId] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyDesignation, setNewFacultyDesignation] = useState("");
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const groupedFaculty = faculty.reduce((acc, fac) => {
    if (!acc[fac.designation]) {
      acc[fac.designation] = [];
    }
    acc[fac.designation].push(fac);
    return acc;
  }, {});

  const handleAddFaculty = () => {
    if (!newFacultyId.trim() || !newFacultyName.trim() || !newFacultyDesignation) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newFac = {
      id: Date.now(),
      facultyId: newFacultyId.trim(),
      name: newFacultyName.trim(),
      designation: newFacultyDesignation,
    };

    setFaculty([...faculty, newFac]);
    resetForm();
    setShowAddDialog(false);

    toast({
      title: "Success",
      description: "Faculty member added successfully",
    });
  };

  const handleEditFaculty = () => {
    if (!newFacultyId.trim() || !newFacultyName.trim() || !newFacultyDesignation) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setFaculty(
      faculty.map((fac) =>
        fac.id === editingFaculty.id
          ? {
              ...fac,
              facultyId: newFacultyId.trim(),
              name: newFacultyName.trim(),
              designation: newFacultyDesignation,
            }
          : fac
      )
    );

    resetForm();
    setShowEditDialog(false);

    toast({
      title: "Success",
      description: "Faculty member updated successfully",
    });
  };

  const handleDeleteFaculty = (facId) => {
    setFaculty(faculty.filter((fac) => fac.id !== facId));
    toast({
      title: "Deleted",
      description: "Faculty member removed",
    });
  };

  const openEditDialog = (fac) => {
    setEditingFaculty(fac);
    setNewFacultyId(fac.facultyId);
    setNewFacultyName(fac.name);
    setNewFacultyDesignation(fac.designation);
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setNewFacultyId("");
    setNewFacultyName("");
    setNewFacultyDesignation("");
    setEditingFaculty(null);
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
        
        if (!headers.includes("faculty") || !headers.includes("name") || !headers.includes("designation")) {
          toast({
            title: "Invalid File",
            description: "Excel/CSV must have columns: Faculty ID, Name, Designation",
            variant: "destructive",
          });
          return;
        }

        const newFacultyList = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values.length >= 3) {
            newFacultyList.push({
              id: Date.now() + i,
              facultyId: values[0],
              name: values[1],
              designation: values[2],
            });
          }
        }

        if (newFacultyList.length > 0) {
          setFaculty([...faculty, ...newFacultyList]);
          toast({
            title: "Success",
            description: `${newFacultyList.length} faculty members imported`,
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

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4" />
          Add Faculty
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Bulk Upload (CSV/Excel)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Faculty Sections by Designation */}
      {designations.map((designation) => {
        const facultyInDesignation = groupedFaculty[designation];
        if (!facultyInDesignation || facultyInDesignation.length === 0) return null;

        return (
          <Card key={designation}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary">{designation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {facultyInDesignation.map((fac) => (
                  <div
                    key={fac.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{fac.name}</p>
                        <p className="text-sm text-muted-foreground">{fac.facultyId}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(fac)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFaculty(fac.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {Object.keys(groupedFaculty).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No faculty members added yet</p>
          </CardContent>
        </Card>
      )}

      {/* Add Faculty Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Faculty Member</DialogTitle>
            <DialogDescription>Enter the details for the new faculty member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="facultyId">Faculty ID</Label>
              <Input
                id="facultyId"
                placeholder="e.g., FAC007"
                value={newFacultyId}
                onChange={(e) => setNewFacultyId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultyName">Name</Label>
              <Input
                id="facultyName"
                placeholder="e.g., Dr. Jane Doe"
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Select value={newFacultyDesignation} onValueChange={setNewFacultyDesignation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddFaculty} className="bg-gradient-primary hover:opacity-90">
              Add Faculty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Faculty Member</DialogTitle>
            <DialogDescription>Update the faculty member details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFacultyId">Faculty ID</Label>
              <Input
                id="editFacultyId"
                value={newFacultyId}
                onChange={(e) => setNewFacultyId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFacultyName">Name</Label>
              <Input
                id="editFacultyName"
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDesignation">Designation</Label>
              <Select value={newFacultyDesignation} onValueChange={setNewFacultyDesignation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditFaculty} className="bg-gradient-primary hover:opacity-90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyTab;
