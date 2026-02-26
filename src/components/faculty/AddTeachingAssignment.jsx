import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Upload,
  Plus,
  X,
  Users,
  BookOpen,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data matching admin structure
const mockSemesters = [
  {
    id: 1,
    name: "Semester 1",
    subjects: [
      { id: 1, code: "CS101", name: "Introduction to Programming", type: "theory", credits: 3 },
      { id: 2, code: "MA101", name: "Engineering Mathematics I", type: "theory", credits: 4 },
    ],
  },
  {
    id: 2,
    name: "Semester 2",
    subjects: [
      { id: 3, code: "CS102", name: "Data Structures", type: "theory", credits: 3 },
      { id: 4, code: "CS103", name: "Data Structures Lab", type: "lab", credits: 1 },
    ],
  },
  {
    id: 3,
    name: "Semester 3",
    subjects: [
      { id: 5, code: "22CSC21", name: "Software Engineering", type: "theory", credits: 3 },
      { id: 6, code: "22CSC23", name: "CASE Tools Lab", type: "lab", credits: 1 },
      { id: 7, code: "22ITC08", name: "Computer Networks", type: "theory", credits: 3 },
    ],
  },
];

const mockBatches = [
  {
    id: 1,
    startYear: 2023,
    endYear: 2027,
    sections: [
      {
        id: 1,
        name: "CSE-3A",
        students: [
          { id: "s1", rollNo: "CSE-3A-001", name: "Alice Johnson" },
          { id: "s2", rollNo: "CSE-3A-002", name: "Bob Williams" },
          { id: "s3", rollNo: "CSE-3A-003", name: "Carol Davis" },
          { id: "s4", rollNo: "CSE-3A-004", name: "David Miller" },
          { id: "s5", rollNo: "CSE-3A-005", name: "Emma Wilson" },
          { id: "s6", rollNo: "CSE-3A-006", name: "Frank Thomas" },
        ],
      },
      {
        id: 2,
        name: "CSE-3B",
        students: [
          { id: "s7", rollNo: "CSE-3B-001", name: "Grace Lee" },
          { id: "s8", rollNo: "CSE-3B-002", name: "Henry Brown" },
          { id: "s9", rollNo: "CSE-3B-003", name: "Ivy Chen" },
          { id: "s10", rollNo: "CSE-3B-004", name: "Jake Martin" },
          { id: "s11", rollNo: "CSE-3B-005", name: "Karen White" },
        ],
      },
    ],
  },
  {
    id: 2,
    startYear: 2024,
    endYear: 2026,
    sections: [
      {
        id: 3,
        name: "MTech-1A",
        students: [
          { id: "s12", rollNo: "MT-1A-001", name: "Liam Davis" },
          { id: "s13", rollNo: "MT-1A-002", name: "Mia Garcia" },
          { id: "s14", rollNo: "MT-1A-003", name: "Noah Wilson" },
        ],
      },
    ],
  },
];

const academicYears = ["2024-25", "2025-26", "2026-27"];

const STEPS = [
  { id: 1, label: "Subject Info" },
  { id: 2, label: "Teaching Mode" },
  { id: 3, label: "Students" },
];

const AddTeachingAssignment = ({ open, onOpenChange, onAdd }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Step
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectOpen, setSubjectOpen] = useState(false);

  // Step 2
  const [teachingType, setTeachingType] = useState("section");

  // Step 3 – Full Section
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // Step 3 – Elective
  const [electiveBatch, setElectiveBatch] = useState("");
  const [electiveSections, setElectiveSections] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [manualRoll, setManualRoll] = useState("");
  const [manualName, setManualName] = useState("");

  const reset = () => {
    setCurrentStep(1);
    setSemester("");
    setAcademicYear("");
    setSubjectId("");
    setTeachingType("section");
    setSelectedBatch("");
    setSelectedSection("");
    setElectiveBatch("");
    setElectiveSections([]);
    setSelectedStudents([]);
    setStudentSearch("");
    setManualRoll("");
    setManualName("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Derived data
  const currentSemester = mockSemesters.find((s) => s.id.toString() === semester);
  const subjects = currentSemester?.subjects || [];
  const selectedSubject = subjects.find((s) => s.id.toString() === subjectId);

  const currentBatchObj = mockBatches.find((b) => b.id.toString() === selectedBatch);
  const currentSectionObj = currentBatchObj?.sections.find((s) => s.id.toString() === selectedSection);

  const electiveBatchObj = mockBatches.find((b) => b.id.toString() === electiveBatch);
  const electiveAvailableStudents = electiveSections.length > 0
    ? electiveBatchObj?.sections
        .filter((s) => electiveSections.includes(s.id.toString()))
        .flatMap((s) => s.students.map((st) => ({ ...st, section: s.name }))) || []
    : [];

  const filteredElectiveStudents = electiveAvailableStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Validation
  const canProceedStep1 = semester && academicYear && subjectId;
  const canProceedStep2 = true; // always valid, just a radio pick

  const getTotalStudents = () => {
    if (teachingType === "section") {
      return currentSectionObj?.students.length || 0;
    }
    return selectedStudents.length;
  };

  const canSubmit = () => {
    if (teachingType === "section") {
      return selectedBatch && selectedSection;
    }
    return selectedStudents.length > 0;
  };

  // Student selection
  const toggleStudent = (student) => {
    setSelectedStudents((prev) => {
      const exists = prev.find((s) => s.id === student.id);
      if (exists) return prev.filter((s) => s.id !== student.id);
      return [...prev, student];
    });
  };

  const selectAllFiltered = () => {
    setSelectedStudents((prev) => {
      const newStudents = filteredElectiveStudents.filter(
        (s) => !prev.find((p) => p.id === s.id)
      );
      return [...prev, ...newStudents];
    });
  };

  const removeStudent = (id) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleManualAdd = () => {
    if (!manualRoll.trim() || !manualName.trim()) return;
    const newStudent = {
      id: `manual-${Date.now()}`,
      rollNo: manualRoll.trim(),
      name: manualName.trim(),
      section: "Manual",
    };
    setSelectedStudents((prev) => [...prev, newStudent]);
    setManualRoll("");
    setManualName("");
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const lines = text.split("\n").filter((l) => l.trim());
        const imported = [];
        for (let i = 0; i < lines.length; i++) {
          const parts = lines[i].split(",").map((v) => v.trim());
          if (parts.length >= 1 && parts[0]) {
            imported.push({
              id: `csv-${Date.now()}-${i}`,
              rollNo: parts[0],
              name: parts[1] || parts[0],
              section: "Uploaded",
            });
          }
        }
        if (imported.length > 0) {
          setSelectedStudents((prev) => [...prev, ...imported]);
          toast({ title: "Imported", description: `${imported.length} students added from CSV` });
        }
      } catch {
        toast({ title: "Error", description: "Failed to parse CSV", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    const assignment = {
      id: `assign-${Date.now()}`,
      semester: currentSemester?.name,
      academicYear,
      subject: selectedSubject,
      teachingType,
      ...(teachingType === "section"
        ? {
            batch: currentBatchObj,
            section: currentSectionObj,
            students: currentSectionObj?.students || [],
          }
        : {
            students: selectedStudents,
          }),
    };
    onAdd(assignment);
    toast({
      title: "Teaching Assignment Added",
      description: `${selectedSubject.code} – ${selectedSubject.name} with ${getTotalStudents()} students`,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5" />
            Add Teaching Assignment
          </DialogTitle>
          <DialogDescription>
            Set up a new subject with students for marks management
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-3">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <Separator className="flex-1" />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 pb-4">
            {/* ─── STEP 1: Subject Info ─── */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Semester</Label>
                  <Select value={semester} onValueChange={(v) => { setSemester(v); setSubjectId(""); }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSemesters.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Academic Year</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Subject</Label>
                  <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={subjectOpen}
                        className="w-full justify-between h-11 font-normal"
                        disabled={!semester}
                      >
                        {selectedSubject
                          ? `${selectedSubject.code} – ${selectedSubject.name}`
                          : "Search and select subject..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search subject..." />
                        <CommandList>
                          <CommandEmpty>No subject found.</CommandEmpty>
                          <CommandGroup>
                            {subjects.map((sub) => (
                              <CommandItem
                                key={sub.id}
                                value={`${sub.code} ${sub.name}`}
                                onSelect={() => {
                                  setSubjectId(sub.id.toString());
                                  setSubjectOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    subjectId === sub.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="font-medium mr-2">{sub.code}</span>
                                <span className="text-muted-foreground">{sub.name}</span>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {sub.type}
                                </Badge>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedSubject && (
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{selectedSubject.code} – {selectedSubject.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={selectedSubject.type === "theory" ? "default" : "secondary"}>
                            {selectedSubject.type}
                          </Badge>
                          <Badge variant="outline">{selectedSubject.credits} credits</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 2: Teaching Mode ─── */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Teaching Type</Label>
                  <RadioGroup value={teachingType} onValueChange={setTeachingType} className="gap-0">
                    <label
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-t-lg border-2 cursor-pointer transition-colors",
                        teachingType === "section"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value="section" className="mt-0.5" />
                      <div>
                        <p className="font-semibold">Full Section</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Assign an entire section of students. All students in the section will be included automatically.
                        </p>
                      </div>
                    </label>
                    <label
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-b-lg border-2 border-t-0 cursor-pointer transition-colors",
                        teachingType === "elective"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value="elective" className="mt-0.5" />
                      <div>
                        <p className="font-semibold">Elective / Custom Students</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Hand-pick students from multiple sections, upload roll numbers, or add manually.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {selectedSubject && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <span className="text-muted-foreground">Subject: </span>
                    <span className="font-medium">{selectedSubject.code} – {selectedSubject.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 3: Students ─── */}
            {currentStep === 3 && teachingType === "section" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Batch</Label>
                  <Select value={selectedBatch} onValueChange={(v) => { setSelectedBatch(v); setSelectedSection(""); }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBatches.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.startYear} – {b.endYear}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Section</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedBatch}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentBatchObj?.sections.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name} ({s.students.length} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentSectionObj && (
                  <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Section: {currentSectionObj.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentSectionObj.students.length} students • Batch {currentBatchObj.startYear}–{currentBatchObj.endYear}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && teachingType === "elective" && (
              <div className="space-y-5">
                <Tabs defaultValue="pick" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-10">
                    <TabsTrigger value="pick" className="text-xs sm:text-sm">
                      <Search className="w-3 h-3 mr-1" />
                      From Sections
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs sm:text-sm">
                      <Upload className="w-3 h-3 mr-1" />
                      Upload CSV
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs sm:text-sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Manual
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pick" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Batch</Label>
                        <Select value={electiveBatch} onValueChange={(v) => { setElectiveBatch(v); setElectiveSections([]); }}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockBatches.map((b) => (
                              <SelectItem key={b.id} value={b.id.toString()}>
                                {b.startYear}–{b.endYear}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Sections</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {electiveBatchObj?.sections.map((sec) => {
                            const isSelected = electiveSections.includes(sec.id.toString());
                            return (
                              <Badge
                                key={sec.id}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer transition-colors"
                                onClick={() => {
                                  setElectiveSections((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== sec.id.toString())
                                      : [...prev, sec.id.toString()]
                                  );
                                }}
                              >
                                {sec.name}
                              </Badge>
                            );
                          })}
                          {!electiveBatch && (
                            <span className="text-xs text-muted-foreground">Select batch first</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {electiveSections.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">
                            Students ({filteredElectiveStudents.length})
                          </Label>
                          <Button variant="ghost" size="sm" onClick={selectAllFiltered} className="text-xs h-7">
                            Select All
                          </Button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search students..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="pl-9 h-9"
                          />
                        </div>
                        <ScrollArea className="h-[180px] border rounded-lg">
                          <div className="p-1">
                            {filteredElectiveStudents.map((student) => {
                              const isChecked = !!selectedStudents.find((s) => s.id === student.id);
                              return (
                                <label
                                  key={student.id}
                                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded cursor-pointer"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleStudent(student)}
                                  />
                                  <span className="font-mono text-xs text-muted-foreground w-24">
                                    {student.rollNo}
                                  </span>
                                  <span className="text-sm flex-1">{student.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {student.section}
                                  </Badge>
                                </label>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center space-y-3">
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">Upload Roll Numbers</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          CSV or TXT file. Format: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">rollNo,name</code>
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleCSVUpload}
                        className="hidden"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-3 mt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Roll No"
                        value={manualRoll}
                        onChange={(e) => setManualRoll(e.target.value)}
                        className="flex-1 h-10"
                      />
                      <Input
                        placeholder="Name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="flex-1 h-10"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={handleManualAdd}
                        disabled={!manualRoll.trim() || !manualName.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Selected Students Chips */}
                {selectedStudents.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <Label className="text-xs font-semibold">
                      Selected Students ({selectedStudents.length})
                    </Label>
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                      {selectedStudents.map((s) => (
                        <Badge
                          key={s.id}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {s.rollNo}
                          <button
                            onClick={() => removeStudent(s.id)}
                            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="flex-row justify-between items-center gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {currentStep === 3 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Total Students: <strong>{getTotalStudents()}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={currentStep === 1 && !canProceedStep1}
                className="bg-gradient-primary hover:opacity-90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Subject
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeachingAssignment;
