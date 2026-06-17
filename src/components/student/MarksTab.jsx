import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen, BarChart3, FileText, ClipboardList, FileCheck, Calendar,
  TrendingUp, Award, Pencil, Save, X, Plus, Trash2, ArrowLeft, FlaskConical, GraduationCap,
} from "lucide-react";
import MarksInsights from "@/components/student/MarksInsights";
import {
  buildStudentSemesterData,
  setStudentSubjectMarks,
  setStudentSubjectGrade,
  addStudentCustomSubject,
  removeStudentCustomSubject,
} from "@/lib/dataStore";

const gradePoints = { S: 10, A: 9, B: 8, C: 7, D: 6, F: 0 };
const gradeOptions = ["S", "A", "B", "C", "D", "F"];
const gradeColors = {
  S: "bg-accent text-accent-foreground",
  A: "bg-primary text-primary-foreground",
  B: "bg-info text-primary-foreground",
  C: "bg-warning text-primary-foreground",
  D: "bg-muted text-muted-foreground",
  F: "bg-destructive text-destructive-foreground",
};

const calcTheoryCIE = (m) => {
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const slipTest = avg(m.slipTests);
  const assignment = avg(m.assignments);
  const classTest = avg(m.classTests);
  return {
    slipTest: Math.round(slipTest * 10) / 10,
    assignment: Math.round(assignment * 10) / 10,
    classTest: Math.round(classTest * 10) / 10,
    attendance: m.attendance,
    total: Math.round((slipTest + assignment + classTest + m.attendance) * 10) / 10,
  };
};
const calcLabCIE = (m) => {
  const w = m.weeklyCIE.reduce((a, b) => a + b, 0);
  const i = m.internalTests.reduce((a, b) => a + b, 0);
  return { weeklyCIE: w, internalTests: i, total: w + i };
};
const cieOf = (s) => (s.type === "theory" ? calcTheoryCIE(s.marks).total : calcLabCIE(s.marks).total);
const maxCIE = (s) => (s.type === "theory" ? 40 : 50);

const MarksTab = ({ studentId, latestSemester }) => {
  const [semesterData, setSemesterData] = useState(() => buildStudentSemesterData(studentId));
  const [currentSemester, setCurrentSemester] = useState(String(latestSemester));
  const [selectedCode, setSelectedCode] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const refresh = () => setSemesterData(buildStudentSemesterData(studentId));

  const grades = useMemo(() => {
    const g = {};
    Object.entries(semesterData).forEach(([sem, d]) => {
      d.subjects.forEach((s) => { if (s.grade) g[`${sem}-${s.courseCode}`] = s.grade; });
    });
    return g;
  }, [semesterData]);

  const semData = semesterData[currentSemester] || { subjects: [] };
  const isPastSem = parseInt(currentSemester, 10) < latestSemester;
  const selected = semData.subjects.find((s) => s.courseCode === selectedCode);

  const calcSGPA = (semNum) => {
    const d = semesterData[semNum];
    if (!d || !d.subjects.length) return null;
    let c = 0, p = 0;
    for (const s of d.subjects) {
      if (!s.grade) return null;
      c += s.credits; p += s.credits * gradePoints[s.grade];
    }
    return c ? Math.round((p / c) * 100) / 100 : null;
  };
  const calcCGPA = () => {
    let c = 0, p = 0;
    for (let sem = 1; sem <= 8; sem++) {
      const d = semesterData[sem];
      if (!d || !d.subjects.length) continue;
      const all = d.subjects.every((s) => s.grade);
      if (!all) continue;
      for (const s of d.subjects) { c += s.credits; p += s.credits * gradePoints[s.grade]; }
    }
    return c ? Math.round((p / c) * 100) / 100 : null;
  };

  const sgpa = calcSGPA(parseInt(currentSemester, 10));
  const cgpa = calcCGPA();

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(selected.marks)));
    setEditing(true);
  };
  const cancelEdit = () => { setDraft(null); setEditing(false); };
  const saveEdit = () => {
    setStudentSubjectMarks(studentId, parseInt(currentSemester, 10), selected.courseCode, draft);
    setEditing(false); setDraft(null); refresh();
  };
  const setGrade = (g) => {
    setStudentSubjectGrade(studentId, parseInt(currentSemester, 10), selected.courseCode, g);
    refresh();
  };
  const removeCustom = () => {
    removeStudentCustomSubject(studentId, parseInt(currentSemester, 10), selected.courseCode);
    setSelectedCode(null); refresh();
  };

  const selectSubject = (code) => {
    setSelectedCode(code === selectedCode ? null : code);
    setEditing(false); setDraft(null);
  };

  const liveMarks = editing ? draft : selected?.marks;
  const liveCIE = selected
    ? (selected.type === "theory" ? calcTheoryCIE(liveMarks) : calcLabCIE(liveMarks))
    : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <MarksInsights semesterData={semesterData} grades={grades} />

      {/* Semester selector + GPA */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <Card className="flex-1 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Semester</p>
                <Select
                  value={currentSemester}
                  onValueChange={(v) => { setCurrentSemester(v); setSelectedCode(null); setEditing(false); }}
                >
                  <SelectTrigger className="w-[200px] h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Semester {s}
                        {s === latestSemester ? " (Current)" : ""}
                        {s < latestSemester ? " (Past)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator orientation="vertical" className="h-12 hidden sm:block" />
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subjects</p>
                  <p className="text-2xl font-bold">{semData.subjects.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Credits</p>
                  <p className="text-2xl font-bold">{semData.subjects.reduce((t, s) => t + s.credits, 0)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Card className="shadow-md min-w-[120px] sm:min-w-[140px]">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">SGPA</p>
              <p className="text-3xl font-bold text-primary">{sgpa ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Sem {currentSemester}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md min-w-[120px] sm:min-w-[140px]">
            <CardContent className="pt-6 text-center">
              <Award className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CGPA</p>
              <p className="text-3xl font-bold text-accent">{cgpa ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Overall</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subjects grid */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                My Subjects
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {isPastSem
                  ? "Past semester — you can edit marks, set grades or add subjects."
                  : "Click a subject to view its detailed marks breakdown."}
              </CardDescription>
            </div>
            {isPastSem && (
              <AddSubjectDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onAdd={(data) => {
                  addStudentCustomSubject(studentId, parseInt(currentSemester, 10), data);
                  setAddOpen(false); refresh();
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {semData.subjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No subjects for this semester yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {semData.subjects.map((s) => {
                const isSel = s.courseCode === selectedCode;
                const total = cieOf(s);
                return (
                  <Card
                    key={s.courseCode}
                    onClick={() => selectSubject(s.courseCode)}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 border-2 ${isSel ? "border-primary shadow-md" : "border-transparent"}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg sm:text-xl mb-1 truncate">{s.courseCode}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{s.name}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <Badge variant={s.type === "theory" ? "default" : "secondary"}>
                            {s.type === "theory" ? "Theory" : "Lab"}
                          </Badge>
                          {s.isCustom && <Badge variant="outline" className="text-[10px]">Custom</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Credits</span>
                        <span className="font-medium">{s.credits}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-semibold">CIE Total</span>
                        <span className="font-bold text-2xl text-primary">
                          {total}<span className="text-sm text-muted-foreground">/{maxCIE(s)}</span>
                        </span>
                      </div>
                      {s.grade && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Grade</span>
                          <Badge className={`text-base px-3 ${gradeColors[s.grade] || ""}`}>{s.grade}</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject detail */}
      {selected && (
        <Card className="shadow-lg border-primary">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => setSelectedCode(null)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                </div>
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl mb-2">
                  {selected.type === "theory"
                    ? <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                    : <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />}
                  <span className="truncate">{selected.name}</span>
                </CardTitle>
                <CardDescription>
                  {selected.courseCode} | {selected.type === "theory" ? "Theory" : "Lab"} Subject · {selected.credits} Credits
                  {selected.isCustom && <Badge variant="outline" className="ml-2 text-[10px]">Custom</Badge>}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">CIE Total</p>
                <p className="text-3xl font-bold text-primary">{liveCIE.total}<span className="text-base text-muted-foreground">/{maxCIE(selected)}</span></p>
              </div>
            </div>

            {/* Edit toolbar (past sems or custom) */}
            {(isPastSem || selected.isCustom) && (
              <div className="flex flex-wrap items-center gap-2 pt-4">
                {!editing ? (
                  <Button size="sm" variant="outline" onClick={startEdit}>
                    <Pencil className="w-4 h-4 mr-1" /> Edit marks
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={saveEdit}>
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Label className="text-xs text-muted-foreground">Final Grade</Label>
                  <Select value={selected.grade || ""} onValueChange={setGrade}>
                    <SelectTrigger className="w-[110px] h-9"><SelectValue placeholder="Set" /></SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selected.isCustom && (
                    <Button size="sm" variant="destructive" onClick={removeCustom}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {selected.type === "theory" ? (
              <TheoryBreakdown
                marks={liveMarks}
                editing={editing}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
              />
            ) : (
              <LabBreakdown
                marks={liveMarks}
                editing={editing}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Semester strip */}
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5" /> Semester-wise SGPA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {[1,2,3,4,5,6,7,8].map((sem) => {
              const s = calcSGPA(sem);
              const hasSubs = semesterData[sem]?.subjects.length > 0;
              return (
                <div
                  key={sem}
                  className={`text-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    String(sem) === currentSemester ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => { setCurrentSemester(String(sem)); setSelectedCode(null); }}
                >
                  <p className="text-xs text-muted-foreground mb-1">Sem {sem}</p>
                  <p className={`text-lg font-bold ${s ? "text-primary" : "text-muted-foreground"}`}>
                    {s ?? (hasSubs ? "—" : "·")}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Subcomponents ───────────────────────────────────────────────────────────

const MarkCell = ({ label, value, max, editing, onChange }) => (
  <Card className="bg-muted/30 border-muted">
    <CardContent className="pt-6 pb-6 text-center">
      <p className="text-sm text-muted-foreground mb-2 font-medium">{label}</p>
      {editing ? (
        <div className="flex items-center justify-center gap-1">
          <Input
            type="number" min={0} max={max}
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
            className="w-20 text-center text-xl font-bold h-11"
          />
          <span className="text-sm text-muted-foreground">/{max}</span>
        </div>
      ) : (
        <p className="text-3xl font-bold text-primary">{value}<span className="text-base text-muted-foreground">/{max}</span></p>
      )}
    </CardContent>
  </Card>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
      <Icon className="w-5 h-5" /> {title}
    </h3>
    {children}
  </div>
);

const TheoryBreakdown = ({ marks, editing, onChange }) => (
  <div className="space-y-8">
    <Section title="Slip Tests (Max 5 each)" icon={FileText}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {marks.slipTests.map((v, i) => (
          <MarkCell
            key={i} label={`Slip Test ${i + 1}`} value={v} max={5} editing={editing}
            onChange={(nv) => { const a = [...marks.slipTests]; a[i] = nv; onChange({ slipTests: a }); }}
          />
        ))}
      </div>
    </Section>
    <Section title="Assignments (Max 10 each)" icon={ClipboardList}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {marks.assignments.map((v, i) => (
          <MarkCell
            key={i} label={`Assignment ${i + 1}`} value={v} max={10} editing={editing}
            onChange={(nv) => { const a = [...marks.assignments]; a[i] = nv; onChange({ assignments: a }); }}
          />
        ))}
      </div>
    </Section>
    <Section title="Class Tests (Max 20 each)" icon={FileCheck}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {marks.classTests.map((v, i) => (
          <MarkCell
            key={i} label={`Class Test ${i + 1}`} value={v} max={20} editing={editing}
            onChange={(nv) => { const a = [...marks.classTests]; a[i] = nv; onChange({ classTests: a }); }}
          />
        ))}
      </div>
    </Section>
    <Section title="Attendance (Max 5)" icon={Calendar}>
      <div className="max-w-xs">
        <MarkCell
          label="Attendance Marks" value={marks.attendance} max={5} editing={editing}
          onChange={(nv) => onChange({ attendance: nv })}
        />
      </div>
    </Section>
  </div>
);

const LabBreakdown = ({ marks, editing, onChange }) => (
  <div className="space-y-8">
    <Section title="Internal Tests (Max 20 each)" icon={FileCheck}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {marks.internalTests.map((v, i) => (
          <MarkCell
            key={i} label={`Internal ${i + 1}`} value={v} max={20} editing={editing}
            onChange={(nv) => { const a = [...marks.internalTests]; a[i] = nv; onChange({ internalTests: a }); }}
          />
        ))}
      </div>
    </Section>
    <Section title="Weekly CIE (Max 30 each)" icon={FileText}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {marks.weeklyCIE.map((v, i) => (
          <MarkCell
            key={i} label={`Week ${i + 1}`} value={v} max={30} editing={editing}
            onChange={(nv) => { const a = [...marks.weeklyCIE]; a[i] = nv; onChange({ weeklyCIE: a }); }}
          />
        ))}
      </div>
      {editing && (
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => onChange({ weeklyCIE: [...marks.weeklyCIE, 0] })}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Week
          </Button>
          {marks.weeklyCIE.length > 1 && (
            <Button
              variant="outline" size="sm"
              onClick={() => onChange({ weeklyCIE: marks.weeklyCIE.slice(0, -1) })}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Remove Week
            </Button>
          )}
        </div>
      )}
    </Section>
  </div>
);

const AddSubjectDialog = ({ open, onOpenChange, onAdd }) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("theory");
  const [credits, setCredits] = useState(3);

  const submit = () => {
    if (!code.trim() || !name.trim()) return;
    onAdd({ courseCode: code.trim().toUpperCase(), name: name.trim(), type, credits });
    setCode(""); setName(""); setType("theory"); setCredits(3);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Add Subject</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a subject</DialogTitle>
          <DialogDescription>
            Track a subject the faculty kept outside this system. Marks &amp; grades you set here count towards SGPA / CGPA.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Course Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 22ITE05" />
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" min={0} step={0.5} value={credits} onChange={(e) => setCredits(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Service Oriented Architecture" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="theory">Theory (CIE 40)</SelectItem>
                <SelectItem value="lab">Lab (CIE 50)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add Subject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarksTab;
