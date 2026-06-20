import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { BookOpen, Plus, Users, GraduationCap, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getStore,
  addAssignment,
  findStudentByRoll,
  addManualStudent,
} from "@/lib/dataStore";

const ACADEMIC_YEARS = ["2024-25", "2025-26", "2026-27", "2027-28"];
const COURSES = [{ id: "btech-it", name: "B.Tech — Information Technology" }];

const AddTeachingAssignment = ({ open, onOpenChange, facultyId, onAdded }) => {
  const { toast } = useToast();
  const store = getStore();
  const department = store.department;

  const [academicYear, setAcademicYear] = useState("2026-27");
  const [departmentId, setDepartmentId] = useState(String(department.id));
  const [courseId, setCourseId] = useState("btech-it");
  const [semester, setSemester] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [rollNumbersText, setRollNumbersText] = useState("");

  const reset = () => {
    setAcademicYear("2026-27");
    setDepartmentId(String(department.id));
    setCourseId("btech-it");
    setSemester("");
    setSubjectCode("");
    setSectionId("");
    setRollNumbersText("");
  };

  const handleClose = (next) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // Subjects for chosen semester
  const subjectsForSem = useMemo(() => {
    if (!semester) return [];
    return store.subjects.filter((s) => s.semester === parseInt(semester, 10));
  }, [semester, store.subjects]);

  const selectedSubject = useMemo(
    () => store.subjects.find((s) => s.code === subjectCode) || null,
    [subjectCode, store.subjects],
  );

  const isElective =
    selectedSubject && (selectedSubject.category || "core") === "elective";

  // Sections currently in this semester (for non-elective)
  const eligibleSections = useMemo(() => {
    if (!semester) return [];
    const sem = parseInt(semester, 10);
    return store.sections
      .filter((sec) => sec.currentSemester === sem)
      .map((sec) => {
        const batch = store.batches.find((b) => b.id === sec.batchId);
        return { ...sec, batch };
      });
  }, [semester, store.sections, store.batches]);

  // Parse roll numbers list
  const parsedRolls = useMemo(() => {
    return rollNumbersText
      .split(/[\s,;\n]+/)
      .map((r) => r.trim())
      .filter(Boolean);
  }, [rollNumbersText]);

  const rollPreview = useMemo(() => {
    return parsedRolls.map((roll) => ({
      roll,
      student: findStudentByRoll(roll),
    }));
  }, [parsedRolls]);

  const canSubmit = () => {
    if (!academicYear || !semester || !subjectCode) return false;
    if (isElective) return parsedRolls.length > 0;
    return Boolean(sectionId);
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const sem = parseInt(semester, 10);
    let studentIds = [];
    let sId = null;
    let bId = null;

    if (isElective) {
      for (const roll of parsedRolls) {
        const existing = findStudentByRoll(roll);
        if (existing) {
          studentIds.push(existing.id);
        } else {
          const newId = addManualStudent({
            rollNumber: roll,
            name: roll,
            sectionName: "Elective",
          });
          studentIds.push(newId);
        }
      }
    } else {
      const sec = store.sections.find((s) => s.id === sectionId);
      sId = sec.id;
      bId = sec.batchId;
      studentIds = sec.studentIds.slice();
    }

    const a = addAssignment({
      facultyId,
      subjectCode,
      sectionId: sId,
      batchId: bId,
      semester: sem,
      academicYear,
      studentIds,
      isElective: !!isElective,
    });

    toast({
      title: "Subject added",
      description: `${selectedSubject.code} — ${selectedSubject.name} (${studentIds.length} students)`,
    });
    onAdded?.(a);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5" />
            Add Teaching Assignment
          </DialogTitle>
          <DialogDescription>
            Pick a subject from your department's catalogue and assign students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Academic / Department / Course */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(department.id)}>
                    {department.name} ({department.abbreviation})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Semester */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Semester
            </Label>
            <Select
              value={semester}
              onValueChange={(v) => {
                setSemester(v);
                setSubjectCode("");
                setSectionId("");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8].map((s) => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Subject
            </Label>
            <Select
              value={subjectCode}
              onValueChange={(v) => { setSubjectCode(v); setSectionId(""); }}
              disabled={!semester}
            >
              <SelectTrigger>
                <SelectValue placeholder={semester ? "Select subject" : "Pick semester first"} />
              </SelectTrigger>
              <SelectContent>
                {subjectsForSem.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} — {s.name} {s.type === "P" ? "(Lab)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSubject && (
              <div className="bg-muted/50 p-3 rounded-lg border flex flex-wrap gap-2 items-center text-sm">
                <span className="font-semibold">{selectedSubject.code}</span>
                <span className="text-muted-foreground">— {selectedSubject.name}</span>
                <Badge variant="outline">{selectedSubject.credits} credits</Badge>
                <Badge variant="secondary">{selectedSubject.type === "T" ? "Theory" : "Lab"}</Badge>
                <Badge variant={isElective ? "default" : "outline"}>
                  {isElective ? "Elective" : "Core"}
                </Badge>
              </div>
            )}
          </div>

          {/* Roster picker */}
          {selectedSubject && !isElective && (
            <div className="space-y-2">
              <Separator />
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Section
              </Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    eligibleSections.length
                      ? "Choose a section currently in this semester"
                      : "No sections currently in this semester"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {eligibleSections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.name} • {sec.batch?.name} • {sec.studentIds.length} students
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sectionId && (() => {
                const sec = eligibleSections.find((s) => s.id === sectionId);
                return sec ? (
                  <p className="text-xs text-muted-foreground">
                    {sec.studentIds.length} students will be enrolled.
                  </p>
                ) : null;
              })()}
            </div>
          )}

          {selectedSubject && isElective && (
            <div className="space-y-2">
              <Separator />
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Roll Numbers
              </Label>
              <Textarea
                placeholder={"Paste roll numbers separated by commas, spaces, or new lines\ne.g.  160122737001, 160122737002, 160122737003"}
                value={rollNumbersText}
                onChange={(e) => setRollNumbersText(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
              {parsedRolls.length > 0 && (
                <div className="border rounded-lg p-3 max-h-44 overflow-y-auto space-y-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    {parsedRolls.length} roll number(s) —
                    {" "}{rollPreview.filter((r) => r.student).length} matched,
                    {" "}{rollPreview.filter((r) => !r.student).length} will be added as external
                  </p>
                  {rollPreview.map(({ roll, student }) => (
                    <div key={roll} className="flex items-center justify-between text-xs">
                      <span className="font-mono">{roll}</span>
                      {student ? (
                        <span className="text-muted-foreground">{student.name}</span>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">external</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeachingAssignment;
