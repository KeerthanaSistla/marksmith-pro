import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, BookOpen, MessageCircle, Layers, FileText, ListChecks, Headphones,
  Loader2, Send, RotateCcw, Play, Pause, Square, ChevronLeft, ChevronRight, Check, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSyllabusUnits, buildStudentSemesterData, getDefaultStudentId, getStore } from "@/lib/dataStore";

// ─────────────────────────────────────────────────────────────────────────────
// Subject picker — uses student's CURRENT semester subjects from the store
// ─────────────────────────────────────────────────────────────────────────────
function useStudentSubjects() {
  return useMemo(() => {
    const sid = getDefaultStudentId();
    if (!sid) return [];
    const store = getStore();
    const semData = buildStudentSemesterData(sid);
    const subs = [];
    for (let s = 8; s >= 1; s--) {
      if (semData[s]?.subjects?.length) {
        semData[s].subjects.forEach((sub) => {
          const meta = store.subjects.find((x) => x.code === sub.courseCode);
          subs.push({
            code: sub.courseCode,
            name: sub.name,
            credits: sub.credits,
            type: meta?.type || "T",
            semester: s,
          });
        });
        if (subs.length) break;
      }
    }
    return subs;
  }, []);
}

function buildSubjectPayload(subject) {
  const units = getSyllabusUnits(subject.code);
  return { ...subject, units };
}

// ─────────────────────────────────────────────────────────────────────────────
// Doubt Chat
// ─────────────────────────────────────────────────────────────────────────────
function DoubtChat({ subject }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! Ask me anything about **${subject.name}** — I have the syllabus units loaded.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Reset on subject switch
  useEffect(() => {
    setMessages([{ role: "assistant", content: `Hi! Ask me anything about **${subject.name}** — I have the syllabus units loaded.` }]);
  }, [subject.code]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const payload = buildSubjectPayload(subject);
      const syllabusContext = `Subject: ${payload.code} — ${payload.name}\nUnits:\n` +
        payload.units.map((u, i) => `${i + 1}. ${u.title}\n   Topics: ${u.topics.join(", ")}`).join("\n");
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: next.map(({ role, content }) => ({ role, content })),
          syllabusContext,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((p) => [...p, { role: "assistant", content: data.reply || "(no response)" }]);
    } catch (e) {
      toast.error(e?.message || "Couldn't reach the assistant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[480px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 rounded-lg border">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-background border rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border rounded-2xl px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask about ${subject.code}…`} disabled={loading} />
        <Button type="submit" disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flashcards
// ─────────────────────────────────────────────────────────────────────────────
function Flashcards({ subject }) {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true); setCards([]); setIdx(0); setFlipped(false);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: { mode: "flashcards", subject: buildSubjectPayload(subject) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list = Array.isArray(data?.flashcards) ? data.flashcards : [];
      if (!list.length) throw new Error("No cards returned");
      setCards(list);
    } catch (e) {
      toast.error(e?.message || "Couldn't generate flashcards");
    } finally { setLoading(false); }
  };

  if (loading) return <Centered><Loader2 className="w-8 h-8 animate-spin" /><p className="mt-3 text-sm text-muted-foreground">Generating flashcards…</p></Centered>;
  if (!cards.length) return (
    <Centered>
      <Layers className="w-10 h-10 mb-3 text-primary" />
      <p className="font-medium mb-1">Generate flashcards for {subject.code}</p>
      <p className="text-xs text-muted-foreground mb-4">8 Q&A cards based on the uploaded syllabus units.</p>
      <Button onClick={generate} className="gap-2"><Sparkles className="w-4 h-4" /> Generate</Button>
    </Centered>
  );

  const c = cards[idx];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">{idx + 1} / {cards.length}</Badge>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setFlipped(false); setIdx((i) => (i - 1 + cards.length) % cards.length); }}><ChevronLeft className="w-4 h-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => { setFlipped(false); setIdx((i) => (i + 1) % cards.length); }}><ChevronRight className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={generate} className="gap-1"><RotateCcw className="w-3 h-3" />Regenerate</Button>
        </div>
      </div>
      <div
        onClick={() => setFlipped((f) => !f)}
        className="min-h-[260px] cursor-pointer rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-8 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg"
      >
        {c.unit && <Badge variant="secondary" className="mb-3 text-xs">{c.unit}</Badge>}
        <p className="text-lg font-medium leading-relaxed">{flipped ? c.a : c.q}</p>
        <p className="text-xs text-muted-foreground mt-6">{flipped ? "Click to see question" : "Click to reveal answer"}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notes / Summary
// ─────────────────────────────────────────────────────────────────────────────
function Notes({ subject }) {
  const [unit, setUnit] = useState("all");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const units = getSyllabusUnits(subject.code);

  const generate = async () => {
    setLoading(true); setText("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: { mode: "notes", subject: buildSubjectPayload(subject), unit: unit === "all" ? null : unit },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setText(data.text || data.raw || "");
    } catch (e) {
      toast.error(e?.message || "Couldn't generate notes");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Scope</p>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Whole subject</SelectItem>
              {units.map((u, i) => <SelectItem key={i} value={u.title}>{u.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {text ? "Regenerate" : "Generate Notes"}
        </Button>
      </div>
      {text ? (
        <div className="prose prose-sm max-w-none p-5 border rounded-lg bg-muted/20 whitespace-pre-wrap text-sm leading-relaxed">
          {text}
        </div>
      ) : (
        <Centered><FileText className="w-10 h-10 mb-3 text-primary" /><p className="text-sm text-muted-foreground">Pick a unit and generate concise revision notes.</p></Centered>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MCQ Quiz
// ─────────────────────────────────────────────────────────────────────────────
function MCQQuiz({ subject }) {
  const [qs, setQs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true); setQs([]); setAnswers({}); setSubmitted(false);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: { mode: "mcq", subject: buildSubjectPayload(subject) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list = Array.isArray(data?.questions) ? data.questions : [];
      if (!list.length) throw new Error("No questions returned");
      setQs(list);
    } catch (e) {
      toast.error(e?.message || "Couldn't generate quiz");
    } finally { setLoading(false); }
  };

  if (loading) return <Centered><Loader2 className="w-8 h-8 animate-spin" /><p className="mt-3 text-sm text-muted-foreground">Generating quiz…</p></Centered>;
  if (!qs.length) return (
    <Centered>
      <ListChecks className="w-10 h-10 mb-3 text-primary" />
      <p className="font-medium mb-1">Practice quiz for {subject.code}</p>
      <p className="text-xs text-muted-foreground mb-4">6 MCQs from the uploaded syllabus.</p>
      <Button onClick={generate} className="gap-2"><Sparkles className="w-4 h-4" /> Generate</Button>
    </Centered>
  );

  const score = qs.reduce((s, q, i) => s + (answers[i] === q.answerIndex ? 1 : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{Object.keys(answers).length} / {qs.length} answered</div>
        <div className="flex gap-2">
          {submitted && <Badge className="text-sm">Score: {score} / {qs.length}</Badge>}
          <Button size="sm" variant="ghost" onClick={generate} className="gap-1"><RotateCcw className="w-3 h-3" />New quiz</Button>
        </div>
      </div>
      {qs.map((q, i) => {
        const chosen = answers[i];
        return (
          <Card key={i} className="shadow-sm">
            <CardContent className="pt-4 space-y-2">
              <p className="font-medium text-sm"><span className="text-muted-foreground mr-2">Q{i + 1}.</span>{q.q}</p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = submitted && oi === q.answerIndex;
                  const isWrongPick = submitted && isChosen && oi !== q.answerIndex;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((p) => ({ ...p, [i]: oi }))}
                      className={`text-left text-sm px-3 py-2 rounded-md border transition-colors flex items-center gap-2 ${
                        isCorrect ? "border-accent bg-accent/10" :
                        isWrongPick ? "border-destructive bg-destructive/10" :
                        isChosen ? "border-primary bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      {submitted && isCorrect && <Check className="w-4 h-4 text-accent shrink-0" />}
                      {submitted && isWrongPick && <X className="w-4 h-4 text-destructive shrink-0" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <p className="text-xs text-muted-foreground italic pt-1 border-t mt-2">💡 {q.explanation}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
      {!submitted && (
        <Button className="w-full" disabled={Object.keys(answers).length !== qs.length} onClick={() => setSubmitted(true)}>
          Submit Quiz
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio Overview — generates a script then uses browser Speech Synthesis
// ─────────────────────────────────────────────────────────────────────────────
function AudioOverview({ subject }) {
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const utterRef = useRef(null);

  const stopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  };

  useEffect(() => () => stopSpeech(), []);
  useEffect(() => { stopSpeech(); setScript(""); }, [subject.code]);

  const generate = async () => {
    stopSpeech(); setLoading(true); setScript("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: { mode: "audio", subject: buildSubjectPayload(subject) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setScript(data.text || data.raw || "");
    } catch (e) {
      toast.error(e?.message || "Couldn't generate audio script");
    } finally { setLoading(false); }
  };

  const play = () => {
    if (!script || typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Speech not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 1.0; u.pitch = 1.0;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };

  const pauseResume = () => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPlaying(true); }
    else { window.speechSynthesis.pause(); setPlaying(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-md border-primary/30">
        <CardContent className="pt-5 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Audio overview — {subject.code}</p>
            <p className="text-xs text-muted-foreground">AI-written script, narrated by your browser's voice. Great for revising on the go.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={generate} disabled={loading} variant={script ? "outline" : "default"} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {script ? "Regenerate" : "Generate"}
            </Button>
            {script && !playing && <Button onClick={play} className="gap-2"><Play className="w-4 h-4" />Play</Button>}
            {script && playing && <Button onClick={pauseResume} variant="outline" className="gap-2"><Pause className="w-4 h-4" />Pause</Button>}
            {script && <Button onClick={stopSpeech} variant="ghost" size="icon"><Square className="w-4 h-4" /></Button>}
          </div>
        </CardContent>
      </Card>
      {script ? (
        <div className="text-sm leading-relaxed p-5 border rounded-lg bg-muted/20 whitespace-pre-wrap">{script}</div>
      ) : (
        <Centered><Headphones className="w-10 h-10 mb-3 text-primary" /><p className="text-sm text-muted-foreground">Generate a 150-word audio overview to listen on the go.</p></Centered>
      )}
    </div>
  );
}

const Centered = ({ children }) => (
  <div className="min-h-[260px] flex flex-col items-center justify-center text-center p-6">{children}</div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Root AI Zone
// ─────────────────────────────────────────────────────────────────────────────
const AiZone = () => {
  const subjects = useStudentSubjects();
  const [code, setCode] = useState(subjects[0]?.code || "");
  const subject = subjects.find((s) => s.code === code) || subjects[0];

  if (!subject) {
    return (
      <Card><CardContent className="py-16 text-center text-muted-foreground">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>No subjects registered yet. Once you have an active semester, the AI Zone will unlock.</p>
      </CardContent></Card>
    );
  }

  const units = getSyllabusUnits(subject.code);

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <CardContent className="pt-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                AI Zone
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </h2>
              <p className="text-sm text-muted-foreground">
                Personalised study aids powered by the syllabus your department uploaded.
              </p>
            </div>
            <div className="min-w-[260px]">
              <p className="text-xs text-muted-foreground mb-1">Subject</p>
              <Select value={subject.code} onValueChange={setCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.code} value={s.code}>{s.code} — {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Syllabus units:</span>
            {units.map((u, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">{u.title.replace(/^Unit [IVX]+ — /, "")}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-11">
          <TabsTrigger value="chat" className="gap-2"><MessageCircle className="w-4 h-4" />Doubts</TabsTrigger>
          <TabsTrigger value="cards" className="gap-2"><Layers className="w-4 h-4" />Flashcards</TabsTrigger>
          <TabsTrigger value="notes" className="gap-2"><FileText className="w-4 h-4" />Notes</TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2"><ListChecks className="w-4 h-4" />Quiz</TabsTrigger>
          <TabsTrigger value="audio" className="gap-2"><Headphones className="w-4 h-4" />Audio</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-6"><DoubtChat subject={subject} /></TabsContent>
        <TabsContent value="cards" className="mt-6"><Flashcards subject={subject} /></TabsContent>
        <TabsContent value="notes" className="mt-6"><Notes subject={subject} /></TabsContent>
        <TabsContent value="quiz" className="mt-6"><MCQQuiz subject={subject} /></TabsContent>
        <TabsContent value="audio" className="mt-6"><AudioOverview subject={subject} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AiZone;
