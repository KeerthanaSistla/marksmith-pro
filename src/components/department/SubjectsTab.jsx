import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, Pencil, Trash2, BookOpen, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Full IT department curriculum (Semesters 1-8)
// Note: All projects, internships, mini-projects, seminars are treated as Practical (P).
const SEED_SUBJECTS = [
  // ===== Semester 1 =====
  { code: "22MTC01", name: "Linear Algebra & Calculus", credits: 4, type: "T", semester: 1, abbreviation: "LAC" },
  { code: "22PYC01", name: "Optics and Semiconductor Physics", credits: 3, type: "T", semester: 1, abbreviation: "OSP" },
  { code: "22CSC01", name: "Problem Solving and Programming", credits: 3, type: "T", semester: 1, abbreviation: "PSP" },
  { code: "22EGC01", name: "English", credits: 2, type: "T", semester: 1, abbreviation: "ENG" },
  { code: "22PYC03", name: "Optics and Semiconductor Physics Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "OSP Lab" },
  { code: "22EGC02", name: "English Lab", credits: 1, type: "P", semester: 1, abbreviation: "ENG Lab" },
  { code: "22CSC02", name: "Problem Solving and Programming Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "PSP Lab" },
  { code: "22MEC01", name: "CAD and Drafting", credits: 2.5, type: "P", semester: 1, abbreviation: "CAD" },
  { code: "22MEC38", name: "Digital Fabrication Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "DF Lab" },

  // ===== Semester 2 =====
  { code: "22MTC04", name: "Differential Equations & Numerical Methods", credits: 4, type: "T", semester: 2, abbreviation: "DENM" },
  { code: "22CYC01", name: "Chemistry", credits: 3, type: "T", semester: 2, abbreviation: "CHEM" },
  { code: "22EEC01", name: "Basic Electrical Engineering", credits: 3, type: "T", semester: 2, abbreviation: "BEE" },
  { code: "22CSC03", name: "Object Oriented Programming", credits: 3, type: "T", semester: 2, abbreviation: "OOP" },
  { code: "22CYC02", name: "Chemistry Lab", credits: 1.5, type: "P", semester: 2, abbreviation: "CHEM Lab" },
  { code: "22MBC02", name: "Community Engagement", credits: 1.5, type: "P", semester: 2, abbreviation: "CE" },
  { code: "22CSC04", name: "Object Oriented Programming Lab", credits: 1, type: "P", semester: 2, abbreviation: "OOP Lab" },
  { code: "22MEC37", name: "Robotics and Drones Lab", credits: 3, type: "P", semester: 2, abbreviation: "RD Lab" },
  { code: "22EEC02", name: "Basic Electrical Engineering Lab", credits: 1, type: "P", semester: 2, abbreviation: "BEE Lab" },

  // ===== Semester 3 =====
  { code: "22ITC01", name: "Digital Logic and Computer Architecture", credits: 3, type: "T", semester: 3, abbreviation: "DLCA" },
  { code: "22CSC05", name: "Data Structures", credits: 3, type: "T", semester: 3, abbreviation: "DS" },
  { code: "22CSC32", name: "Discrete Mathematics", credits: 3, type: "T", semester: 3, abbreviation: "DM" },
  { code: "22ITC02", name: "Java Programming", credits: 3, type: "T", semester: 3, abbreviation: "Java" },
  { code: "22CSC15", name: "Operating Systems", credits: 3, type: "T", semester: 3, abbreviation: "OS" },
  { code: "22EGM01", name: "Indian Constitution and Fundamental Principles", credits: 0, type: "T", semester: 3, abbreviation: "ICFP" },
  { code: "22ADE01", name: "Data Analysis and Visualization", credits: 3, type: "T", semester: 3, abbreviation: "DAV" },
  { code: "22CSC31", name: "Data Structures Lab", credits: 1, type: "P", semester: 3, abbreviation: "DS Lab" },
  { code: "22ITC03", name: "Java Programming Lab", credits: 1, type: "P", semester: 3, abbreviation: "Java Lab" },
  { code: "22ITC04", name: "Operating Systems Lab", credits: 1, type: "P", semester: 3, abbreviation: "OS Lab" },
  { code: "22ITC05", name: "IT Workshop", credits: 1, type: "P", semester: 3, abbreviation: "IT Workshop" },
  { code: "22ITI01", name: "MOOCs/Training/Internship", credits: 2, type: "P", semester: 3, abbreviation: "Internship-I" },

  // ===== Semester 4 =====
  { code: "22MTC15", name: "Probability and Queueing Theory", credits: 4, type: "T", semester: 4, abbreviation: "PQT" },
  { code: "22ECC40", name: "DC Circuits, Sensors and Transducers", credits: 3, type: "T", semester: 4, abbreviation: "DCCST" },
  { code: "22CSC11", name: "Database Management Systems", credits: 3, type: "T", semester: 4, abbreviation: "DBMS" },
  { code: "22CSC14", name: "Design and Analysis of Algorithms", credits: 3, type: "T", semester: 4, abbreviation: "DAA" },
  { code: "22ITE01", name: "Data Mining", credits: 3, type: "T", semester: 4, abbreviation: "DM" },
  { code: "22ITE02", name: "Digital Image Processing", credits: 3, type: "T", semester: 4, abbreviation: "DIP" },
  { code: "22ITE03", name: "Fundamentals of Cryptography", credits: 3, type: "T", semester: 4, abbreviation: "FOC" },
  { code: "22ITE04", name: "Mobile Application Development", credits: 3, type: "T", semester: 4, abbreviation: "MAD" },
  { code: "22MBC01", name: "Engineering Economics & Accountancy", credits: 3, type: "T", semester: 4, abbreviation: "EEA" },
  { code: "22CEM01", name: "Environmental Science", credits: 0, type: "T", semester: 4, abbreviation: "EVS" },
  { code: "22CSC33", name: "Database Management Systems Lab", credits: 1, type: "P", semester: 4, abbreviation: "DBMS Lab" },
  { code: "22ITC06", name: "Algorithms Lab", credits: 1, type: "P", semester: 4, abbreviation: "DAA Lab" },
  { code: "22ITC07", name: "Mini Project - I", credits: 1, type: "P", semester: 4, abbreviation: "Mini Project-I" },

  // ===== Semester 5 =====
  { code: "22CSC21", name: "Software Engineering", credits: 3, type: "T", semester: 5, abbreviation: "SE" },
  { code: "22ITC08", name: "Enterprise Application Development", credits: 3, type: "T", semester: 5, abbreviation: "EAD" },
  { code: "22CAC17", name: "Machine Learning", credits: 3, type: "T", semester: 5, abbreviation: "ML" },
  { code: "22ITC10", name: "Computer Networks", credits: 3, type: "T", semester: 5, abbreviation: "CN" },
  { code: "22ITC12", name: "Formal Languages and Automata Theory", credits: 3, type: "T", semester: 5, abbreviation: "FLAT" },
  { code: "22ITE05", name: "Service Oriented Architecture", credits: 3, type: "T", semester: 5, abbreviation: "SOA" },
  { code: "22ITE06", name: "Software Project Management", credits: 3, type: "T", semester: 5, abbreviation: "SPM" },
  { code: "22ADE31", name: "Information Retrieval Systems", credits: 3, type: "T", semester: 5, abbreviation: "IRS" },
  { code: "22CIE55", name: "Cyber Security", credits: 3, type: "T", semester: 5, abbreviation: "CS" },
  { code: "22CIE15", name: "Extended Reality", credits: 3, type: "T", semester: 5, abbreviation: "XR" },
  { code: "22CSC23", name: "CASE Tools Lab", credits: 1, type: "P", semester: 5, abbreviation: "CASE Lab" },
  { code: "22ITC09", name: "Enterprise Application Development Lab", credits: 1, type: "P", semester: 5, abbreviation: "EAD Lab" },
  { code: "22ITC11", name: "Computer Networks Lab", credits: 1, type: "P", semester: 5, abbreviation: "CN Lab" },
  { code: "22CAC18", name: "Machine Learning Lab", credits: 1, type: "P", semester: 5, abbreviation: "ML Lab" },
  { code: "22ITC16", name: "Competitive Coding", credits: 1, type: "P", semester: 5, abbreviation: "CC" },
  { code: "22ITI02", name: "Industrial / Rural Internship-II", credits: 2, type: "P", semester: 5, abbreviation: "Internship-II" },

  // ===== Semester 6 =====
  { code: "22ADC12", name: "Big Data Analytics", credits: 3, type: "T", semester: 6, abbreviation: "BDA" },
  { code: "22ITC13", name: "Embedded Systems and Internet of Things", credits: 3, type: "T", semester: 6, abbreviation: "ESIoT" },
  { code: "22CAC04", name: "Deep Learning", credits: 3, type: "T", semester: 6, abbreviation: "DL" },
  { code: "22CSC24", name: "Compiler Design", credits: 3, type: "T", semester: 6, abbreviation: "CD" },
  { code: "22EEM01", name: "Universal Human Values II: Understanding Harmony", credits: 1, type: "T", semester: 6, abbreviation: "UHV" },
  { code: "22CAC15", name: "Artificial Intelligence", credits: 3, type: "T", semester: 6, abbreviation: "AI" },
  { code: "22ITE07", name: "Cloud Computing", credits: 3, type: "T", semester: 6, abbreviation: "CC" },
  { code: "22ITE09", name: "Advanced Computer Networks", credits: 3, type: "T", semester: 6, abbreviation: "ACN" },
  { code: "22CIE07", name: "Ethical Hacking", credits: 3, type: "T", semester: 6, abbreviation: "EH" },
  { code: "22ITE10", name: "Scalable Web Application Development", credits: 3, type: "T", semester: 6, abbreviation: "SWAD" },
  { code: "22CAE19", name: "Natural Language Processing", credits: 3, type: "T", semester: 6, abbreviation: "NLP" },
  { code: "22ADC13", name: "Big Data Analytics Lab", credits: 1, type: "P", semester: 6, abbreviation: "BDA Lab" },
  { code: "22ITC14", name: "Embedded Systems and IoT Lab", credits: 1, type: "P", semester: 6, abbreviation: "ESIoT Lab" },
  { code: "22CAC05", name: "Deep Learning Lab", credits: 1, type: "P", semester: 6, abbreviation: "DL Lab" },
  { code: "22ITC15", name: "Mini Project - II", credits: 1, type: "P", semester: 6, abbreviation: "Mini Project-II" },
  { code: "22EGC03", name: "Employability Skills", credits: 1, type: "P", semester: 6, abbreviation: "ES" },
  { code: "22ITU02", name: "Up-Skill Certification Course-II", credits: 0.5, type: "P", semester: 6, abbreviation: "Upskill-II" },

  // ===== Semester 7 =====
  { code: "22CAC08", name: "Data Science", credits: 3, type: "T", semester: 7, abbreviation: "DS" },
  { code: "22CIE27", name: "Blockchain Technology", credits: 3, type: "T", semester: 7, abbreviation: "BT" },
  { code: "22ITE12", name: "Augmented and Virtual Reality", credits: 3, type: "T", semester: 7, abbreviation: "AVR" },
  { code: "22CIE03", name: "Cyber Forensics", credits: 3, type: "T", semester: 7, abbreviation: "CF" },
  { code: "22ITE08", name: "Microservices Architecture", credits: 3, type: "T", semester: 7, abbreviation: "MSA" },
  { code: "22ADE02", name: "Distributed Systems", credits: 3, type: "T", semester: 7, abbreviation: "DSYS" },
  { code: "22ADE18", name: "Bioinformatics", credits: 3, type: "T", semester: 7, abbreviation: "BIO" },
  { code: "22MCO01", name: "Intellectual Property Rights", credits: 3, type: "T", semester: 7, abbreviation: "IPR" },
  { code: "22ECO01", name: "Environmental Impact Assessment", credits: 3, type: "T", semester: 7, abbreviation: "EIA" },
  { code: "22CEO01", name: "Remote Sensing and GIS", credits: 3, type: "T", semester: 7, abbreviation: "RSGIS" },
  { code: "22MEO01", name: "Product Design and Development", credits: 3, type: "T", semester: 7, abbreviation: "PDD" },
  { code: "22AEO01", name: "Robotics in Industry 4.0", credits: 3, type: "T", semester: 7, abbreviation: "RI4" },
  { code: "22ITC26", name: "Project Part-1", credits: 4, type: "P", semester: 7, abbreviation: "Project-1" },
  { code: "22ITC17", name: "Social Outreach", credits: 1, type: "P", semester: 7, abbreviation: "SO" },
  { code: "22ITU03", name: "Up-Skill Certification Course-III", credits: 0.5, type: "P", semester: 7, abbreviation: "Upskill-III" },

  // ===== Semester 8 =====
  { code: "22MAO01", name: "Fundamentals of Quantum Computing", credits: 3, type: "T", semester: 8, abbreviation: "FQC" },
  { code: "22MEO04", name: "Introduction to Operations Research", credits: 3, type: "T", semester: 8, abbreviation: "OR" },
  { code: "22EEO02", name: "Energy Conservation", credits: 3, type: "T", semester: 8, abbreviation: "EC" },
  { code: "22BTO04", name: "Bioinformatics", credits: 3, type: "T", semester: 8, abbreviation: "BIO" },
  { code: "22EGO01", name: "Technical Writing Skills", credits: 3, type: "T", semester: 8, abbreviation: "TWS" },
  { code: "22MEO06", name: "Principles of Entrepreneurship and Startups", credits: 3, type: "T", semester: 8, abbreviation: "ES" },
  { code: "22ECO02", name: "Remote Sensing and GIS", credits: 3, type: "T", semester: 8, abbreviation: "RSGIS" },
  { code: "22CEO02", name: "Disaster Risk Reduction and Management", credits: 3, type: "T", semester: 8, abbreviation: "DRRM" },
  { code: "22BTO05", name: "Cognitive Neuroscience", credits: 3, type: "T", semester: 8, abbreviation: "CN" },
  { code: "22EGO03", name: "Indian Traditional Knowledge", credits: 3, type: "T", semester: 8, abbreviation: "ITK" },
  { code: "22ITC27", name: "Technical Seminar", credits: 1, type: "P", semester: 8, abbreviation: "Seminar" },
  { code: "22ITC28", name: "Project Part-2", credits: 4, type: "P", semester: 8, abbreviation: "Project-2" },
];

const buildInitialSemesters = () => {
  const sems = [];
  for (let i = 1; i <= 8; i++) {
    sems.push({
      id: i,
      name: `Semester ${i}`,
      number: i,
      subjects: SEED_SUBJECTS.filter((s) => s.semester === i).map((s, idx) => ({
        id: `${i}-${idx}-${s.code}`,
        ...s,
      })),
    });
  }
  return sems;
};

const emptySubjectForm = {
  code: "",
  name: "",
  abbreviation: "",
  credits: "",
  type: "T",
};

const SubjectsTab = ({ departmentId }) => {
  const [semesters, setSemesters] = useState(buildInitialSemesters);
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState(emptySubjectForm);
  const [openSemesters, setOpenSemesters] = useState({ 1: true });
  const fileInputRef = useRef(null);
  const uploadSemesterRef = useRef(null);
  const { toast } = useToast();

  const toggleSemester = (semId) => {
    setOpenSemesters((prev) => ({ ...prev, [semId]: !prev[semId] }));
  };

  const updateForm = (patch) => setSubjectForm((p) => ({ ...p, ...patch }));

  const validateForm = () => {
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      toast({ title: "Error", description: "Subject Code and Name are required", variant: "destructive" });
      return false;
    }
    if (subjectForm.credits === "" || isNaN(Number(subjectForm.credits))) {
      toast({ title: "Error", description: "Please enter valid credits", variant: "destructive" });
      return false;
    }
    if (!["T", "P"].includes(subjectForm.type)) {
      toast({ title: "Error", description: "Type must be T or P", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAddSubject = () => {
    if (!validateForm()) return;
    const newSubject = {
      id: `${selectedSemester.id}-${Date.now()}`,
      code: subjectForm.code.trim(),
      name: subjectForm.name.trim(),
      abbreviation: subjectForm.abbreviation.trim() || subjectForm.code.trim(),
      credits: Number(subjectForm.credits),
      type: subjectForm.type,
      semester: selectedSemester.number,
    };
    setSemesters((prev) =>
      prev.map((sem) => (sem.id === selectedSemester.id ? { ...sem, subjects: [...sem.subjects, newSubject] } : sem)),
    );
    resetForm();
    setShowAddSubjectDialog(false);
    toast({ title: "Success", description: "Subject added successfully" });
  };

  const handleEditSubject = () => {
    if (!validateForm()) return;
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === selectedSemester.id
          ? {
              ...sem,
              subjects: sem.subjects.map((sub) =>
                sub.id === editingSubject.id
                  ? {
                      ...sub,
                      code: subjectForm.code.trim(),
                      name: subjectForm.name.trim(),
                      abbreviation: subjectForm.abbreviation.trim() || subjectForm.code.trim(),
                      credits: Number(subjectForm.credits),
                      type: subjectForm.type,
                    }
                  : sub,
              ),
            }
          : sem,
      ),
    );
    resetForm();
    setShowEditSubjectDialog(false);
    toast({ title: "Success", description: "Subject updated successfully" });
  };

  const handleDeleteSubject = (semId, subId) => {
    setSemesters((prev) =>
      prev.map((sem) => (sem.id === semId ? { ...sem, subjects: sem.subjects.filter((s) => s.id !== subId) } : sem)),
    );
    toast({ title: "Deleted", description: "Subject removed" });
  };

  const openAddDialog = (sem) => {
    setSelectedSemester(sem);
    setSubjectForm(emptySubjectForm);
    setShowAddSubjectDialog(true);
  };

  const openEditDialog = (sem, subject) => {
    setSelectedSemester(sem);
    setEditingSubject(subject);
    setSubjectForm({
      code: subject.code,
      name: subject.name,
      abbreviation: subject.abbreviation,
      credits: String(subject.credits ?? ""),
      type: subject.type || "T",
    });
    setShowEditSubjectDialog(true);
  };

  const resetForm = () => {
    setSubjectForm(emptySubjectForm);
    setEditingSubject(null);
    setSelectedSemester(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || uploadSemesterRef.current == null) return;
    const semId = uploadSemesterRef.current;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const lines = text.split("\n").filter((l) => l.trim());
        const headers = lines[0].toLowerCase();
        if (!headers.includes("code") || !headers.includes("name")) {
          toast({
            title: "Invalid File",
            description: "CSV columns: Code, Name, Credits, Type, Abbreviation",
            variant: "destructive",
          });
          return;
        }
        const sem = semesters.find((s) => s.id === semId);
        const newSubjects = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(",").map((v) => v.trim());
          if (vals.length >= 2 && vals[0] && vals[1]) {
            const typeRaw = (vals[3] || "T").toUpperCase();
            newSubjects.push({
              id: `${semId}-${Date.now()}-${i}`,
              code: vals[0],
              name: vals[1],
              credits: vals[2] ? Number(vals[2]) : 0,
              type: typeRaw === "P" ? "P" : "T",
              abbreviation: vals[4]?.trim() || vals[0],
              semester: sem?.number ?? semId,
            });
          }
        }
        if (newSubjects.length > 0) {
          setSemesters((prev) =>
            prev.map((s) => (s.id === semId ? { ...s, subjects: [...s.subjects, ...newSubjects] } : s)),
          );
          toast({ title: "Success", description: `${newSubjects.length} subjects imported` });
        }
      } catch {
        toast({ title: "Error", description: "Failed to parse file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
    uploadSemesterRef.current = null;
  };

  const triggerBulkUpload = (semId) => {
    uploadSemesterRef.current = semId;
    fileInputRef.current?.click();
  };

  const renderSubjectFormFields = () => (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="space-y-2 col-span-1">
        <Label>Subject Code *</Label>
        <Input value={subjectForm.code} onChange={(e) => updateForm({ code: e.target.value })} placeholder="e.g., 22CSC21" />
      </div>
      <div className="space-y-2 col-span-1">
        <Label>Abbreviation</Label>
        <Input value={subjectForm.abbreviation} onChange={(e) => updateForm({ abbreviation: e.target.value })} placeholder="e.g., SE" />
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Subject Name *</Label>
        <Input value={subjectForm.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="e.g., Software Engineering" />
      </div>
      <div className="space-y-2">
        <Label>Credits *</Label>
        <Input
          type="number"
          step="0.5"
          min="0"
          value={subjectForm.credits}
          onChange={(e) => updateForm({ credits: e.target.value })}
          placeholder="e.g., 3"
        />
      </div>
      <div className="space-y-2">
        <Label>Type *</Label>
        <Select value={subjectForm.type} onValueChange={(v) => updateForm({ type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="T">T — Theory</SelectItem>
            <SelectItem value="P">P — Practical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Semester</Label>
        <Input value={selectedSemester?.number ?? ""} disabled />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />

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
                      className={`w-5 h-5 text-muted-foreground transition-transform ${openSemesters[sem.id] ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {sem.subjects.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No subjects added yet</p>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Subject Name</TableHead>
                            <TableHead>Abbreviation</TableHead>
                            <TableHead className="text-center">Credits</TableHead>
                            <TableHead className="text-center">Type</TableHead>
                            <TableHead className="text-center">Sem</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sem.subjects.map((subject) => (
                            <TableRow key={subject.id}>
                              <TableCell className="font-mono text-sm">{subject.code}</TableCell>
                              <TableCell className="font-medium">{subject.name}</TableCell>
                              <TableCell className="text-muted-foreground">{subject.abbreviation}</TableCell>
                              <TableCell className="text-center">{subject.credits}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={subject.type === "P" ? "secondary" : "default"}>
                                  {subject.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{subject.semester}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(sem, subject)}>
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
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openAddDialog(sem)} className="flex-1 gap-2">
                      <Plus className="w-4 h-4" />
                      Add Subject
                    </Button>
                    <Button variant="outline" onClick={() => triggerBulkUpload(sem.id)} className="gap-2">
                      <Upload className="w-4 h-4" />
                      Bulk Upload (CSV)
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Add Subject Dialog */}
      <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject to {selectedSemester?.name}</DialogTitle>
            <DialogDescription>Enter complete subject details</DialogDescription>
          </DialogHeader>
          {renderSubjectFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddSubjectDialog(false); resetForm(); }}>
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
          {renderSubjectFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditSubjectDialog(false); resetForm(); }}>
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
