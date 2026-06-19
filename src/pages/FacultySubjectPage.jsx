import { useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Upload, Plus, Save, FileSpreadsheet, Trash2, Users, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getStore,
  setMarksBulk,
  getLabWeekCount,
  setLabWeekCount,
  computeTheoryCIE,
  computeLabCIE,
  CIE_MAX_THEORY,
  CIE_MAX_LAB,
  setAssignmentStudents,
  getStudentsInBatch,
  addManualStudent,
} from "@/lib/dataStore";

const THEORY_COLS = [
  { key: "slipTests", idx: 0, label: "Slip 1", max: 5 },
  { key: "slipTests", idx: 1, label: "Slip 2", max: 5 },
  { key: "slipTests", idx: 2, label: "Slip 3", max: 5 },
  { key: "assignments", idx: 0, label: "Asgn 1", max: 10 },
  { key: "assignments", idx: 1, label: "Asgn 2", max: 10 },
  { key: "classTests", idx: 0, label: "CT 1", max: 20 },
  { key: "classTests", idx: 1, label: "CT 2", max: 20 },
  { key: "attendance", idx: null, label: "Attd", max: 5 },
];

const FacultySubjectPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef(null);

  const store = getStore();
  const assignment = store.assignments.find((a) => a.id === assignmentId);

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="mb-4">Assignment not found.</p>
          <Button onClick={() => navigate("/faculty")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const subject = store.subjects.find((s) => s.code === assignment.subjectCode);
  const section = store.sections.find((s) => s.id === assignment.sectionId);
  const batch = store.batches.find((b) => b.id === assignment.batchId);
  const isLab = subject.type === "P";
  const isElective = (subject.category || "core") === "elective";

  // Local roster state — editable via "Manage Students" dialog
  const [studentIds, setStudentIds] = useState(() => [...assignment.studentIds]);
  const students = useMemo(
    () =>
      studentIds
        .map((sid) => store.students.find((st) => st.id === sid))
        .filter(Boolean)
        .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber)),
    [studentIds, store],
  );

  // Manage Students dialog state
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterDraft, setRosterDraft] = useState(studentIds);
  const [rosterSearch, setRosterSearch] = useState("");
  const [manualRoll, setManualRoll] = useState("");
  const [manualName, setManualName] = useState("");
  const batchCandidates = useMemo(
    () => (batch ? getStudentsInBatch(batch.id).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber)) : []),
    [batch],
  );
  const filteredCandidates = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return batchCandidates;
    return batchCandidates.filter(
      (s) => s.rollNumber.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [batchCandidates, rosterSearch]);

  const openRoster = () => {
    setRosterDraft([...studentIds]);
    setRosterSearch("");
    setManualRoll("");
    setManualName("");
    setRosterOpen(true);
  };
  const toggleDraft = (sid) => {
    setRosterDraft((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));
  };
  const addManualToDraft = () => {
    if (!manualRoll.trim()) return;
    const id = addManualStudent({
      rollNumber: manualRoll,
      name: manualName || manualRoll,
      batchId: assignment.batchId,
      sectionId: assignment.sectionId,
      sectionName: section?.name,
    });
    setRosterDraft((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setManualRoll("");
    setManualName("");
    toast({ title: "Added", description: "Student added to roster draft." });
  };
  const saveRoster = () => {
    setAssignmentStudents(assignmentId, rosterDraft);
    setStudentIds([...rosterDraft]);
    // Initialize empty grid rows for newly added students
    setGrid((g) => {
      const ng = { ...g };
      for (const sid of rosterDraft) {
        if (!ng[sid]) {
          ng[sid] = isLab
            ? { internalTests: ["", ""], weeklyCIE: Array.from({ length: weekCount }, () => "") }
            : { slipTests: ["", "", ""], assignments: ["", ""], classTests: ["", ""], attendance: "" };
        }
      }
      return ng;
    });
    setRosterOpen(false);
    toast({ title: "Roster updated", description: `${rosterDraft.length} students in this subject.` });
  };


  const initialWeeks = useMemo(() => getLabWeekCount(assignmentId), [assignmentId]);
  const [weekCount, setWeekCount] = useState(isLab ? initialWeeks : 0);

  // Build editable grid (one row per student)
  const buildInitialGrid = (weeks) => {
    const g = {};
    students.forEach((st) => {
      const m = store.marks[`${assignmentId}|${st.id}`] || {};
      if (isLab) {
        g[st.id] = {
          internalTests: [0, 1].map((i) => m.internalTests?.[i] ?? ""),
          weeklyCIE: Array.from({ length: weeks }, (_, i) => m.weeklyCIE?.[i] ?? ""),
        };
      } else {
        g[st.id] = {
          slipTests: [0, 1, 2].map((i) => m.slipTests?.[i] ?? ""),
          assignments: [0, 1].map((i) => m.assignments?.[i] ?? ""),
          classTests: [0, 1].map((i) => m.classTests?.[i] ?? ""),
          attendance: m.attendance ?? "",
        };
      }
    });
    return g;
  };
  const [grid, setGrid] = useState(() => buildInitialGrid(isLab ? initialWeeks : 0));

  const setCell = (sid, key, idx, val) => {
    setGrid((g) => {
      const row = { ...g[sid] };
      if (idx == null) row[key] = val;
      else {
        const arr = [...row[key]];
        arr[idx] = val;
        row[key] = arr;
      }
      return { ...g, [sid]: row };
    });
  };

  const addWeek = () => {
    setWeekCount((n) => n + 1);
    setGrid((g) => {
      const ng = {};
      for (const sid of Object.keys(g)) ng[sid] = { ...g[sid], weeklyCIE: [...g[sid].weeklyCIE, ""] };
      return ng;
    });
  };

  const removeWeek = () => {
    if (weekCount <= 1) return;
    setWeekCount((n) => n - 1);
    setGrid((g) => {
      const ng = {};
      for (const sid of Object.keys(g)) ng[sid] = { ...g[sid], weeklyCIE: g[sid].weeklyCIE.slice(0, -1) };
      return ng;
    });
  };

  const computeRowTotal = (row) => {
    if (isLab) {
      return computeLabCIE({
        internalTests: row.internalTests.map((x) => Number(x) || 0),
        weeklyCIE: row.weeklyCIE.map((x) => Number(x) || 0),
      }).total;
    }
    return computeTheoryCIE({
      slipTests: row.slipTests.map((x) => Number(x) || 0),
      assignments: row.assignments.map((x) => Number(x) || 0),
      classTests: row.classTests.map((x) => Number(x) || 0),
      attendance: Number(row.attendance) || 0,
    }).total;
  };

  const handleSaveAll = () => {
    setMarksBulk(assignmentId, grid);
    if (isLab) setLabWeekCount(assignmentId, weekCount);
    toast({ title: "Saved", description: `Marks updated for ${students.length} students.` });
  };

  // ── Excel Download (current marks) ────────────────────────────────────────
  const handleDownload = async () => {
    const XLSX = await import("xlsx");
    const headers = isLab
      ? ["RollNumber", "Name", "Internal1", "Internal2", ...Array.from({ length: weekCount }, (_, i) => `Week${i + 1}`), "TotalCIE"]
      : ["RollNumber", "Name", "SlipTest1", "SlipTest2", "SlipTest3", "Assignment1", "Assignment2", "ClassTest1", "ClassTest2", "Attendance", "TotalCIE"];
    const rows = students.map((st) => {
      const r = grid[st.id];
      const base = [st.rollNumber, st.name];
      if (isLab) return [...base, ...r.internalTests, ...r.weeklyCIE, computeRowTotal(r)];
      return [...base, ...r.slipTests, ...r.assignments, ...r.classTests, r.attendance, computeRowTotal(r)];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, `${subject.code}_${section?.name}_marks.xlsx`);
    toast({ title: "Downloaded", description: "Excel file saved." });
  };

  // ── Sample template (blank) ───────────────────────────────────────────────
  const handleDownloadSample = async () => {
    const XLSX = await import("xlsx");
    const headers = isLab
      ? ["RollNumber", "Name", "Internal1", "Internal2", ...Array.from({ length: weekCount }, (_, i) => `Week${i + 1}`)]
      : ["RollNumber", "Name", "SlipTest1", "SlipTest2", "SlipTest3", "Assignment1", "Assignment2", "ClassTest1", "ClassTest2", "Attendance"];
    const maxRow = isLab
      ? ["", "Max →", 20, 20, ...Array.from({ length: weekCount }, () => 30)]
      : ["", "Max →", 5, 5, 5, 10, 10, 20, 20, 5];
    const sample = students.slice(0, 3).map((st) =>
      isLab
        ? [st.rollNumber, st.name, "", "", ...Array.from({ length: weekCount }, () => "")]
        : [st.rollNumber, st.name, "", "", "", "", "", "", "", ""],
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, maxRow, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${subject.code}_template.xlsx`);
    toast({ title: "Template ready", description: "Fill marks and upload back." });
  };

  // ── Upload (Excel or CSV) ─────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const byRoll = new Map(students.map((s) => [String(s.rollNumber).trim().toLowerCase(), s]));
      let matched = 0;
      let detectedWeeks = weekCount;

      if (isLab) {
        const weekKeys = Object.keys(json[0] || {}).filter((k) => /^week\s*\d+$/i.test(k));
        detectedWeeks = Math.max(weekCount, weekKeys.length);
      }

      const newGrid = { ...grid };
      // expand week columns if needed
      if (isLab && detectedWeeks > weekCount) {
        for (const sid of Object.keys(newGrid)) {
          newGrid[sid] = {
            ...newGrid[sid],
            weeklyCIE: [...newGrid[sid].weeklyCIE, ...Array.from({ length: detectedWeeks - weekCount }, () => "")],
          };
        }
      }

      for (const row of json) {
        const roll = String(row.RollNumber ?? row["Roll Number"] ?? row.Roll ?? "").trim().toLowerCase();
        if (!roll || roll === "max →") continue;
        const st = byRoll.get(roll);
        if (!st) continue;
        matched++;
        if (isLab) {
          newGrid[st.id] = {
            internalTests: [row.Internal1 ?? "", row.Internal2 ?? ""],
            weeklyCIE: Array.from({ length: detectedWeeks }, (_, i) => row[`Week${i + 1}`] ?? row[`Week ${i + 1}`] ?? ""),
          };
        } else {
          newGrid[st.id] = {
            slipTests: [row.SlipTest1 ?? "", row.SlipTest2 ?? "", row.SlipTest3 ?? ""],
            assignments: [row.Assignment1 ?? "", row.Assignment2 ?? ""],
            classTests: [row.ClassTest1 ?? "", row.ClassTest2 ?? ""],
            attendance: row.Attendance ?? "",
          };
        }
      }

      setGrid(newGrid);
      if (isLab) setWeekCount(detectedWeeks);
      toast({ title: "Uploaded", description: `Parsed marks for ${matched} students. Review and click Save All.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: "Check column headers match the template.", variant: "destructive" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const maxTotal = isLab ? CIE_MAX_LAB : CIE_MAX_THEORY;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary via-primary/80 to-accent text-primary-foreground shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/faculty")} className="text-primary-foreground hover:bg-white/10 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold flex items-center gap-2 truncate">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <span className="truncate">{subject.code} — {subject.name}</span>
              </h1>
              <p className="text-[11px] sm:text-sm opacity-80 truncate">
                {section?.name} • {batch?.name} • Sem {assignment.semester} •{" "}
                <Badge variant="secondary" className="ml-1">{isLab ? "Lab" : "Theory"}</Badge>
              </p>
            </div>
          </div>
          <Badge className="text-xs sm:text-sm bg-white/20 text-primary-foreground shrink-0 whitespace-nowrap">
            {students.length} <span className="hidden sm:inline">students</span>
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Action bar */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Button onClick={handleSaveAll} className="gap-2" size="sm">
                <Save className="w-4 h-4" /> Save All
              </Button>
              <Button variant="outline" onClick={handleDownload} className="gap-2" size="sm">
                <Download className="w-4 h-4" /> <span className="truncate">Download</span>
              </Button>
              <Button variant="outline" onClick={handleDownloadSample} className="gap-2" size="sm">
                <FileSpreadsheet className="w-4 h-4" /> <span className="truncate">Template</span>
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2" size="sm">
                <Upload className="w-4 h-4" /> <span className="truncate">Bulk Upload</span>
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
            {isLab && (
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <span className="text-sm text-muted-foreground">Weeks: {weekCount}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={removeWeek} disabled={weekCount <= 1}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={addWeek} className="gap-1">
                    <Plus className="w-3 h-3" /> Add Week
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marks Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Marks Grid</CardTitle>
            <CardDescription>
              Edit any cell directly. {isLab
                ? `Lab CIE = avg(Internals)/20 + avg(Weeks)/30 → max ${CIE_MAX_LAB}.`
                : `Theory CIE = best-2-of-3 Slips + avg Assignments + avg ClassTests + Attendance → max ${CIE_MAX_THEORY}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="sticky left-0 bg-muted z-10 w-[40px] text-center">#</TableHead>
                    <TableHead className="sticky left-[40px] bg-muted z-10 min-w-[110px]">Roll No</TableHead>
                    <TableHead className="sticky left-[150px] bg-muted z-10 min-w-[180px]">Name</TableHead>
                    {isLab ? (
                      <>
                        <TableHead className="text-center">Internal 1<br /><span className="font-normal text-[10px]">/20</span></TableHead>
                        <TableHead className="text-center">Internal 2<br /><span className="font-normal text-[10px]">/20</span></TableHead>
                        {Array.from({ length: weekCount }, (_, i) => (
                          <TableHead key={i} className="text-center">Week {i + 1}<br /><span className="font-normal text-[10px]">/30</span></TableHead>
                        ))}
                      </>
                    ) : (
                      THEORY_COLS.map((c, i) => (
                        <TableHead key={i} className="text-center">{c.label}<br /><span className="font-normal text-[10px]">/{c.max}</span></TableHead>
                      ))
                    )}
                    <TableHead className="text-center bg-primary/10 font-bold">CIE<br /><span className="font-normal text-[10px]">/{maxTotal}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((st, idx) => {
                    const row = grid[st.id];
                    const total = computeRowTotal(row);
                    const pct = total / maxTotal;
                    const totalCls = pct < 0.4 ? "text-destructive" : pct >= 0.9 ? "text-emerald-600" : "text-primary";
                    return (
                      <TableRow key={st.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                        <TableCell className="sticky left-0 bg-inherit z-10 text-center">{idx + 1}</TableCell>
                        <TableCell className="sticky left-[40px] bg-inherit z-10 font-mono">{st.rollNumber}</TableCell>
                        <TableCell className="sticky left-[150px] bg-inherit z-10 font-medium whitespace-nowrap">{st.name}</TableCell>
                        {isLab ? (
                          <>
                            {[0, 1].map((i) => (
                              <TableCell key={`i${i}`} className="p-1">
                                <Input
                                  type="number" min="0" max="20" step="0.5"
                                  value={row.internalTests[i]}
                                  onChange={(e) => setCell(st.id, "internalTests", i, e.target.value)}
                                  className="h-8 w-16 text-center text-xs mx-auto"
                                />
                              </TableCell>
                            ))}
                            {Array.from({ length: weekCount }, (_, i) => (
                              <TableCell key={`w${i}`} className="p-1">
                                <Input
                                  type="number" min="0" max="30" step="0.5"
                                  value={row.weeklyCIE[i] ?? ""}
                                  onChange={(e) => setCell(st.id, "weeklyCIE", i, e.target.value)}
                                  className="h-8 w-16 text-center text-xs mx-auto"
                                />
                              </TableCell>
                            ))}
                          </>
                        ) : (
                          THEORY_COLS.map((c, i) => (
                            <TableCell key={i} className="p-1">
                              <Input
                                type="number" min="0" max={c.max} step="0.5"
                                value={c.idx == null ? row[c.key] : row[c.key][c.idx]}
                                onChange={(e) => setCell(st.id, c.key, c.idx, e.target.value)}
                                className="h-8 w-16 text-center text-xs mx-auto"
                              />
                            </TableCell>
                          ))
                        )}
                        <TableCell className={`text-center bg-primary/5 font-bold ${totalCls}`}>{total}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Edits are kept in this view until you click <strong>Save All</strong>. Bulk upload merges into the grid for review before saving.
        </p>
      </main>
    </div>
  );
};

export default FacultySubjectPage;
