import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getStore,
  getAssignmentsForSection,
  computeCIETotal,
  CIE_MAX_THEORY,
  CIE_MAX_LAB,
} from "@/lib/dataStore";

/**
 * Builds the marks matrix for a section/semester directly from the unified
 * data store, so it reflects exactly what faculty have entered and what
 * appears in each student's dashboard.
 */
function buildMarksMatrix(sectionId, semester) {
  const store = getStore();
  const assignments = getAssignmentsForSection(sectionId, semester);

  const subjects = assignments
    .map((a) => {
      const sub = store.subjects.find((s) => s.code === a.subjectCode);
      if (!sub) return null;
      return {
        code: sub.code,
        name: sub.name,
        type: sub.type === "T" ? "theory" : "lab",
        maxMark: sub.type === "T" ? CIE_MAX_THEORY : CIE_MAX_LAB,
        credits: sub.credits,
        assignmentId: a.id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.code.localeCompare(b.code));

  const section = store.sections.find((s) => s.id === sectionId);
  const studentList = section?.studentIds
    ?.map((sid) => store.students.find((st) => st.id === sid))
    .filter(Boolean) || [];

  const studentMarks = studentList.map((student) => {
    const marks = {};
    let total = 0;
    subjects.forEach((sub) => {
      const m = store.marks[`${sub.assignmentId}|${student.id}`];
      const cie = computeCIETotal(sub.type === "theory" ? "T" : "P", m);
      marks[sub.code] = cie;
      total += cie || 0;
    });
    return { ...student, marks, total: Math.round(total * 10) / 10 };
  });

  const maxTotal = subjects.reduce((sum, s) => sum + s.maxMark, 0);
  return { subjects, studentMarks, maxTotal };
}

const SectionMarksView = ({ section, batchName, onBack }) => {
  const [selectedSemester, setSelectedSemester] = useState(
    String(section?.semester || 5),
  );
  const { toast } = useToast();

  const { subjects, studentMarks, maxTotal } = useMemo(
    () => buildMarksMatrix(section.id, parseInt(selectedSemester, 10)),
    [section, selectedSemester],
  );

  const handleDownloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const subjectNamesRow = ["S.No", "Roll Number", "Name"];
      subjects.forEach((sub) => subjectNamesRow.push(sub.name));
      subjectNamesRow.push("");

      const subjectCodesRow = ["", "", ""];
      subjects.forEach((sub) => subjectCodesRow.push(sub.code));
      subjectCodesRow.push("Total");

      const maxMarksRow = ["", "", "Max Marks →"];
      subjects.forEach((sub) => maxMarksRow.push(sub.maxMark));
      maxMarksRow.push(maxTotal);

      const dataRows = studentMarks.map((student, idx) => {
        const row = [idx + 1, student.rollNumber, student.name];
        subjects.forEach((sub) => row.push(student.marks[sub.code] ?? ""));
        row.push(student.total);
        return row;
      });

      const wsData = [subjectNamesRow, subjectCodesRow, maxMarksRow, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 18 },
        { wch: 26 },
        ...subjects.map(() => ({ wch: 9 })),
        { wch: 8 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Sem ${selectedSemester}`);
      XLSX.writeFile(
        wb,
        `${section.name}_${batchName}_Sem${selectedSemester}_CIE.xlsx`,
      );
      toast({ title: "Downloaded", description: "Excel file saved" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to generate Excel file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              {section.name} — Final CIE Marks
            </h3>
            <p className="text-sm text-muted-foreground">
              Batch: {batchName} • {studentMarks.length} Students • Live from faculty entries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <SelectItem key={sem} value={sem.toString()}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleDownloadExcel} className="gap-2">
            <Download className="w-4 h-4" /> Download Excel
          </Button>
        </div>
      </div>

      {/* Marks Table */}
      <Card>
        <CardContent className="p-0">
          {subjects.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No subjects assigned for Semester {selectedSemester} in this section yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-b-0">
                    <TableHead rowSpan={2} className="sticky left-0 bg-muted z-10 min-w-[40px] text-center border-r">#</TableHead>
                    <TableHead rowSpan={2} className="sticky left-[40px] bg-muted z-10 min-w-[120px] border-r">Roll No</TableHead>
                    <TableHead rowSpan={2} className="sticky left-[160px] bg-muted z-10 min-w-[180px] border-r">Name</TableHead>
                    {subjects.map((sub) => (
                      <TableHead key={sub.code} className="text-center min-w-[70px] pb-0 text-[10px] leading-tight font-normal text-muted-foreground">
                        <div className="font-mono">{sub.code}</div>
                        <div className="truncate max-w-[80px] mx-auto">{sub.name}</div>
                      </TableHead>
                    ))}
                    <TableHead rowSpan={2} className="text-center min-w-[60px] font-bold bg-muted/50">Total</TableHead>
                  </TableRow>
                  <TableRow>
                    {subjects.map((sub) => (
                      <TableHead key={`max-${sub.code}`} className="text-center font-bold text-foreground">
                        /{sub.maxMark}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentMarks.map((student, idx) => (
                    <TableRow key={student.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <TableCell className="sticky left-0 bg-inherit z-10 text-center font-medium border-r">{idx + 1}</TableCell>
                      <TableCell className="sticky left-[40px] bg-inherit z-10 font-mono text-muted-foreground border-r">{student.rollNumber}</TableCell>
                      <TableCell className="sticky left-[160px] bg-inherit z-10 font-medium text-foreground border-r whitespace-nowrap">{student.name}</TableCell>
                      {subjects.map((sub) => {
                        const mark = student.marks[sub.code];
                        const pct = mark / sub.maxMark;
                        const cellColor = mark === undefined || mark === null
                          ? ""
                          : pct < 0.4
                          ? "text-destructive font-bold"
                          : pct >= 0.9
                          ? "text-emerald-600 font-semibold"
                          : "";
                        return (
                          <TableCell key={sub.code} className={`text-center ${cellColor}`}>
                            {mark ?? ""}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold bg-muted/50">{student.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SectionMarksView;
