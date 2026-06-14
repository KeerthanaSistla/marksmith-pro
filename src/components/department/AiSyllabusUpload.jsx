import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, FileUp, Loader2, CheckCircle2, Trash2, FileText, Brain, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock extraction — replace with real LlamaParse + Gemini pipeline later.
// Each subject ships with 5 syllabus units (title + topics) that drive the
// student AI Zone (flashcards, notes, MCQs, audio overviews, doubt chat).
const mkUnits = (name, custom) => custom || [
  { title: `Unit I — Foundations of ${name}`, topics: ["Introduction", "Terminology", "Scope & motivation"] },
  { title: `Unit II — Core Concepts`,         topics: ["Theoretical principles", "Standard models", "Worked examples"] },
  { title: `Unit III — Techniques & Methods`, topics: ["Algorithms", "Design patterns", "Trade-offs"] },
  { title: `Unit IV — Advanced Topics`,       topics: ["Optimization", "Tooling", "Case studies"] },
  { title: `Unit V — Applications`,           topics: ["Industry use-cases", "Best practices", "Open problems"] },
];

const MOCK_EXTRACTED = [
  { code: "22ITC08", name: "Enterprise Application Development", credits: 3, type: "T", semester: 5, abbreviation: "EAD",
    units: mkUnits("Enterprise Application Development", [
      { title: "Unit I — Enterprise Architecture", topics: ["N-tier architecture", "Java EE platform", "Containers and contexts"] },
      { title: "Unit II — Servlets & JSP", topics: ["Servlet lifecycle", "Sessions and cookies", "JSP & EL", "MVC pattern"] },
      { title: "Unit III — Spring Framework", topics: ["IoC and DI", "Spring Boot", "Spring MVC", "Bean scopes"] },
      { title: "Unit IV — Persistence", topics: ["JDBC", "JPA / Hibernate", "ORM mapping", "Transactions"] },
      { title: "Unit V — REST & Microservices", topics: ["RESTful APIs", "JSON / XML", "Security basics", "Deployment"] },
    ]) },
  { code: "22CAC17", name: "Machine Learning", credits: 3, type: "T", semester: 5, abbreviation: "ML",
    units: mkUnits("Machine Learning", [
      { title: "Unit I — Foundations", topics: ["Supervised vs unsupervised", "Bias-variance", "Train/test split"] },
      { title: "Unit II — Regression", topics: ["Linear regression", "Logistic regression", "Regularization"] },
      { title: "Unit III — Classification", topics: ["Decision trees", "k-NN", "Naive Bayes", "SVM"] },
      { title: "Unit IV — Unsupervised Learning", topics: ["k-Means", "Hierarchical clustering", "PCA"] },
      { title: "Unit V — Neural Networks", topics: ["Perceptron", "Backpropagation", "Activation functions", "Intro to deep learning"] },
    ]) },
  { code: "22ITC10", name: "Computer Networks", credits: 3, type: "T", semester: 5, abbreviation: "CN",
    units: mkUnits("Computer Networks", [
      { title: "Unit I — Introduction", topics: ["OSI & TCP/IP layers", "Topologies", "Transmission media"] },
      { title: "Unit II — Data Link Layer", topics: ["Framing", "Error detection", "MAC protocols", "Ethernet"] },
      { title: "Unit III — Network Layer", topics: ["IP addressing", "Subnetting", "Routing algorithms"] },
      { title: "Unit IV — Transport Layer", topics: ["TCP / UDP", "Flow control", "Congestion control"] },
      { title: "Unit V — Application Layer", topics: ["HTTP / HTTPS", "DNS", "SMTP", "Network security"] },
    ]) },
  { code: "22ITC12", name: "Formal Languages and Automata Theory", credits: 3, type: "T", semester: 5, abbreviation: "FLAT",
    units: mkUnits("Formal Languages and Automata Theory") },
  { code: "22CSC21", name: "Software Engineering", credits: 3, type: "T", semester: 5, abbreviation: "SE",
    units: mkUnits("Software Engineering") },
  { code: "22ITC09", name: "Enterprise Application Development Lab", credits: 1, type: "P", semester: 5, abbreviation: "EAD Lab",
    units: mkUnits("EAD Lab") },
  { code: "22ITC11", name: "Computer Networks Lab", credits: 1, type: "P", semester: 5, abbreviation: "CN Lab",
    units: mkUnits("CN Lab") },
  { code: "22CAC18", name: "Machine Learning Lab", credits: 1, type: "P", semester: 5, abbreviation: "ML Lab",
    units: mkUnits("ML Lab") },
];

const STAGES = [
  { key: "upload", label: "Uploading PDF", icon: FileUp },
  { key: "parse", label: "Parsing document (LlamaParse)", icon: FileText },
  { key: "extract", label: "AI extracting subjects (Gemini)", icon: Brain },
  { key: "review", label: "Ready for review", icon: CheckCircle2 },
];

const AiSyllabusUpload = ({ onApprove }) => {
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [extracted, setExtracted] = useState([]);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const pickFile = () => fileRef.current?.click();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setOpen(true);
    startPipeline();
    e.target.value = "";
  };

  const startPipeline = async () => {
    setProcessing(true);
    setExtracted([]);
    setStageIdx(0);
    setProgress(0);
    // Simulated pipeline stages
    for (let i = 0; i < STAGES.length - 1; i++) {
      setStageIdx(i);
      for (let p = 0; p <= 100; p += 10) {
        setProgress(p);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 60));
      }
    }
    setStageIdx(STAGES.length - 1);
    setProgress(100);
    setExtracted(MOCK_EXTRACTED.map((s, i) => ({ ...s, _id: `ex-${i}`, _keep: true })));
    setProcessing(false);
  };

  const updateRow = (id, patch) =>
    setExtracted((rows) => rows.map((r) => (r._id === id ? { ...r, ...patch } : r)));

  const removeRow = (id) =>
    setExtracted((rows) => rows.filter((r) => r._id !== id));

  const approveAll = () => {
    const kept = extracted.filter((r) => r._keep && r.code && r.name);
    if (kept.length === 0) {
      toast({ title: "Nothing to import", description: "No subjects selected", variant: "destructive" });
      return;
    }
    onApprove(kept.map(({ _id, _keep, ...rest }) => ({
      ...rest,
      credits: Number(rest.credits) || 0,
      semester: Number(rest.semester) || 1,
    })));
    toast({ title: "Imported", description: `${kept.length} subjects added across semesters` });
    closeAll();
  };

  const closeAll = () => {
    setOpen(false);
    setFile(null);
    setExtracted([]);
    setStageIdx(0);
    setProgress(0);
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".pdf" onChange={onFile} className="hidden" />

      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <CardContent className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                AI Syllabus Upload
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                Upload a regulation PDF (e.g. <span className="font-mono">R22_IT_Syllabus.pdf</span>). The system parses it,
                extracts every subject with code, credits, type and semester, and lets you review before adding.
              </p>
            </div>
          </div>
          <Button onClick={pickFile} className="bg-gradient-primary hover:opacity-90 gap-2 shrink-0">
            <FileUp className="w-4 h-4" />
            Upload Syllabus PDF
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => (!v ? closeAll() : null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Syllabus Extraction
            </DialogTitle>
            <DialogDescription>
              {file ? <>Processing <span className="font-mono">{file.name}</span></> : "Processing your syllabus..."}
            </DialogDescription>
          </DialogHeader>

          {/* Pipeline progress */}
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {STAGES.map((s, i) => {
                const Icon = s.icon;
                const active = i === stageIdx;
                const done = i < stageIdx || (!processing && extracted.length > 0 && i === STAGES.length - 1);
                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      done ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                      : active ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-muted/30 border-muted text-muted-foreground"
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {active && processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="text-xs font-medium">{s.label}</div>
                  </div>
                );
              })}
            </div>
            {processing && <Progress value={progress} className="h-2" />}
          </div>

          {/* Review table */}
          {!processing && extracted.length > 0 && (
            <div className="flex-1 overflow-auto border rounded-md mt-2">
              <Table>
                <TableHeader className="bg-muted/40 sticky top-0">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Abbr</TableHead>
                    <TableHead className="w-20 text-center">Credits</TableHead>
                    <TableHead className="w-24 text-center">Type</TableHead>
                    <TableHead className="w-24 text-center">Sem</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extracted.map((row) => (
                    <TableRow key={row._id} className={!row._keep ? "opacity-40" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={row._keep}
                          onChange={(e) => updateRow(row._id, { _keep: e.target.checked })}
                          className="w-4 h-4 accent-primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Input value={row.code} onChange={(e) => updateRow(row._id, { code: e.target.value })} className="h-8 font-mono text-xs" />
                      </TableCell>
                      <TableCell>
                        <Input value={row.name} onChange={(e) => updateRow(row._id, { name: e.target.value })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={row.abbreviation} onChange={(e) => updateRow(row._id, { abbreviation: e.target.value })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.5" value={row.credits} onChange={(e) => updateRow(row._id, { credits: e.target.value })} className="h-8 text-center" />
                      </TableCell>
                      <TableCell>
                        <Select value={row.type} onValueChange={(v) => updateRow(row._id, { type: v })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="T">T</SelectItem>
                            <SelectItem value="P">P</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={String(row.semester)} onValueChange={(v) => updateRow(row._id, { semester: Number(v) })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeRow(row._id)} className="h-8 w-8 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!processing && extracted.length > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <BookOpen className="w-3.5 h-3.5" />
              {extracted.filter(r => r._keep).length} of {extracted.length} subjects selected for import — 
              each with 5 syllabus units extracted (drives the student AI Zone: flashcards, notes, MCQs, audio).
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={closeAll}>Cancel</Button>
            <Button
              onClick={approveAll}
              disabled={processing || extracted.length === 0}
              className="bg-gradient-primary hover:opacity-90 gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiSyllabusUpload;
