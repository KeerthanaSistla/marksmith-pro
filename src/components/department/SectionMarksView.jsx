import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Mock marks data generator — simulates marks uploaded by faculty.
 * In production, this would come from a database keyed by departmentId + section + semester.
 */
function getMockMarksData(section, semester) {
  const semesterSubjects = {
    5: [
      { code: "22CSC21", name: "Software Engineering", type: "theory", maxMark: 40, credits: 4 },
      { code: "22ITC08", name: "Enterprise Application Development", type: "theory", maxMark: 40, credits: 4 },
      { code: "22CAC17", name: "Machine Learning", type: "theory", maxMark: 40, credits: 4 },
      { code: "22ITC10", name: "Computer Networks", type: "theory", maxMark: 40, credits: 3 },
      { code: "22ITC12", name: "Formal Languages and Automata Theory", type: "theory", maxMark: 40, credits: 3 },
      { code: "22ITE06", name: "Software Project Management", type: "theory", maxMark: 40, credits: 3 },
      { code: "22CIE55", name: "Cyber Security", type: "theory", maxMark: 40, credits: 3 },
      { code: "22CSC23", name: "CASE Tools Lab", type: "lab", maxMark: 50, credits: 1 },
      { code: "22ITC09", name: "Enterprise Application Development Lab", type: "lab", maxMark: 50, credits: 1 },
      { code: "22ITC11", name: "Computer Networks Lab", type: "lab", maxMark: 50, credits: 1 },
      { code: "22CAC18", name: "Machine Learning Lab", type: "lab", maxMark: 50, credits: 1 },
      { code: "22ITC16", name: "Competitive Coding", type: "lab", maxMark: 50, credits: 1 },
      { code: "INTERN2", name: "Industrial / Rural Internship-II", type: "lab", maxMark: 50, credits: 2 },
    ],
    6: [
      { code: "22CSC31", name: "Compiler Design", type: "theory", maxMark: 40, credits: 4 },
      { code: "22ITC14", name: "Cloud Computing", type: "theory", maxMark: 40, credits: 3 },
      { code: "22CAC19", name: "Deep Learning", type: "theory", maxMark: 40, credits: 4 },
      { code: "22ITC15", name: "Web Technologies", type: "theory", maxMark: 40, credits: 3 },
      { code: "22CSC32", name: "Compiler Design Lab", type: "lab", maxMark: 50, credits: 1 },
      { code: "22ITC15L", name: "Web Technologies Lab", type: "lab", maxMark: 50, credits: 1 },
    ],
  };

  const subjects = semesterSubjects[semester] || semesterSubjects[5];
  if (!section?.students?.length) return { subjects, studentMarks: [] };

  // Generate deterministic mock marks based on student id
  const studentMarks = section.students.map((student, idx) => {
    const marks = {};
    let total = 0;
    subjects.forEach((sub) => {
      const seed = (student.id || idx) * 31 + sub.code.charCodeAt(2);
      const range = sub.maxMark * 0.35;
      const base = sub.maxMark * 0.65;
      const mark = Math.round(base + (seed % range));
      const clamped = Math.min(mark, sub.maxMark);
      marks[sub.code] = clamped;
      total += clamped;
    });
    return { ...student, marks, total };
  });

  const maxTotal = subjects.reduce((sum, s) => sum + s.maxMark, 0);
  return { subjects, studentMarks, maxTotal };
}

const SectionMarksView = ({ section, batchName, onBack }) => {
  const [selectedSemester, setSelectedSemester] = useState("5");
  const { toast } = useToast();

  const { subjects, studentMarks, maxTotal } = useMemo(
    () => getMockMarksData(section, parseInt(selectedSemester)),
    [section, selectedSemester]
  );

  const handleDownloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      // Build header rows
      const headerRow1 = ["", "", ""];
      const headerRow2 = ["", "", ""];
      const maxRow = ["", "", ""];

      subjects.forEach((sub) => {
        headerRow1.push(`${sub.code}\n${sub.name}`);
        headerRow2.push(sub.code);
        maxRow.push(sub.maxMark);
      });
      headerRow1.push("Total");
      headerRow2.push("");
      maxRow.push(maxTotal);

      // Build data rows
      const dataRows = studentMarks.map((student, idx) => {
        const row = [idx + 1, student.rollNumber, student.name];
        subjects.forEach((sub) => {
          row.push(student.marks[sub.code] ?? "");
        });
        row.push(student.total);
        return row;
      });

      // Subject names header
      const subjectNamesRow = ["", "", ""];
      subjects.forEach((sub) => subjectNamesRow.push(sub.name));
      subjectNamesRow.push("");

      // Subject codes header
      const subjectCodesRow = ["", "", ""];
      subjects.forEach((sub) => subjectCodesRow.push(sub.code));
      subjectCodesRow.push("Total");

      // Max marks row
      const maxMarksRow = ["", "", ""];
      subjects.forEach((sub) => maxMarksRow.push(sub.maxMark));
      maxMarksRow.push(maxTotal);

      const wsData = [subjectNamesRow, subjectCodesRow, maxMarksRow, ...dataRows];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws["!cols"] = [
        { wch: 4 },  // #
        { wch: 18 }, // Roll No
        { wch: 22 }, // Name
        ...subjects.map(() => ({ wch: 8 })),
        { wch: 8 },  // Total
      ];

      // Merge subject name cells (optional, can be complex)
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Semester ${selectedSemester}`);
      XLSX.writeFile(wb, `${section.name}_Semester${selectedSemester}_Marks.xlsx`);

      toast({ title: "Downloaded", description: "Excel file saved successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate Excel file", variant: "destructive" });
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
              {section.name} — CIE Marks
            </h3>
            <p className="text-sm text-muted-foreground">
              Batch: {batchName} • {studentMarks.length} Students
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
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                {/* Subject names row */}
                <TableRow className="border-b-0">
                  <TableHead rowSpan={2} className="sticky left-0 bg-muted z-10 min-w-[40px] text-center border-r">#</TableHead>
                  <TableHead rowSpan={2} className="sticky left-[40px] bg-muted z-10 min-w-[120px] border-r">Roll No</TableHead>
                  <TableHead rowSpan={2} className="sticky left-[160px] bg-muted z-10 min-w-[160px] border-r">Name</TableHead>
                  {subjects.map((sub) => (
                    <TableHead key={sub.code} className="text-center min-w-[60px] pb-0 text-[10px] leading-tight font-normal text-muted-foreground">
                      {sub.name}
                    </TableHead>
                  ))}
                  <TableHead rowSpan={2} className="text-center min-w-[60px] font-bold bg-muted/50">Total</TableHead>
                </TableRow>
                {/* Max marks row */}
                <TableRow>
                  {subjects.map((sub) => (
                    <TableHead key={`max-${sub.code}`} className="text-center font-bold text-foreground">
                      {sub.maxMark}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SectionMarksView;
