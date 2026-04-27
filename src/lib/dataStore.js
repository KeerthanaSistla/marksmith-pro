// ─────────────────────────────────────────────────────────────────────────────
// IntelliGrade — Unified Data Store (single source of truth)
//
// One localStorage-backed object that every page/component reads & writes:
//   • Department (IT) → Batches (2023-2027, 2024-2028) → Sections (IT1/2/3) → Students
//   • Faculty list
//   • Subject catalogue (Sem 1-8 IT curriculum)
//   • Teaching assignments  (faculty × subject × section × academicYear)
//   • CIE marks             (per assignment, per student, per assessment)
//
// All views — Department/Students "View Marks", Faculty "View subject-wise
// marks", Student dashboard — derive from this same store, so changes in one
// place are reflected everywhere. Marks are seeded randomly on first run.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "intelligrade.store.v4";

// ─── Subject catalogue (full IT curriculum, sem 1-8) ────────────────────────
const SUBJECTS = [
  // Sem 1
  { code: "22MTC01", name: "Linear Algebra & Calculus", credits: 4, type: "T", semester: 1, abbreviation: "LAC" },
  { code: "22PYC01", name: "Optics and Semiconductor Physics", credits: 3, type: "T", semester: 1, abbreviation: "OSP" },
  { code: "22CSC01", name: "Problem Solving and Programming", credits: 3, type: "T", semester: 1, abbreviation: "PSP" },
  { code: "22EGC01", name: "English", credits: 2, type: "T", semester: 1, abbreviation: "ENG" },
  { code: "22PYC03", name: "Optics and Semiconductor Physics Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "OSP Lab" },
  { code: "22EGC02", name: "English Lab", credits: 1, type: "P", semester: 1, abbreviation: "ENG Lab" },
  { code: "22CSC02", name: "Problem Solving and Programming Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "PSP Lab" },
  { code: "22MEC01", name: "CAD and Drafting", credits: 2.5, type: "P", semester: 1, abbreviation: "CAD" },
  { code: "22MEC38", name: "Digital Fabrication Lab", credits: 1.5, type: "P", semester: 1, abbreviation: "DF Lab" },
  // Sem 2
  { code: "22MTC04", name: "Differential Equations & Numerical Methods", credits: 4, type: "T", semester: 2, abbreviation: "DENM" },
  { code: "22CYC01", name: "Chemistry", credits: 3, type: "T", semester: 2, abbreviation: "CHEM" },
  { code: "22EEC01", name: "Basic Electrical Engineering", credits: 3, type: "T", semester: 2, abbreviation: "BEE" },
  { code: "22CSC03", name: "Object Oriented Programming", credits: 3, type: "T", semester: 2, abbreviation: "OOP" },
  { code: "22CYC02", name: "Chemistry Lab", credits: 1.5, type: "P", semester: 2, abbreviation: "CHEM Lab" },
  { code: "22MBC02", name: "Community Engagement", credits: 1.5, type: "P", semester: 2, abbreviation: "CE" },
  { code: "22CSC04", name: "Object Oriented Programming Lab", credits: 1, type: "P", semester: 2, abbreviation: "OOP Lab" },
  { code: "22MEC37", name: "Robotics and Drones Lab", credits: 3, type: "P", semester: 2, abbreviation: "RD Lab" },
  { code: "22EEC02", name: "Basic Electrical Engineering Lab", credits: 1, type: "P", semester: 2, abbreviation: "BEE Lab" },
  // Sem 3
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
  // Sem 4
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
  // Sem 5
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
  // Sem 6
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
  // Sem 7
  { code: "22CAC08", name: "Data Science", credits: 3, type: "T", semester: 7, abbreviation: "DS" },
  { code: "22CIE27", name: "Blockchain Technology", credits: 3, type: "T", semester: 7, abbreviation: "BT" },
  { code: "22ITE12", name: "Augmented and Virtual Reality", credits: 3, type: "T", semester: 7, abbreviation: "AVR" },
  { code: "22CIE03", name: "Cyber Forensics", credits: 3, type: "T", semester: 7, abbreviation: "CF" },
  { code: "22ITE08", name: "Microservices Architecture", credits: 3, type: "T", semester: 7, abbreviation: "MSA" },
  { code: "22ITC26", name: "Project Part-1", credits: 4, type: "P", semester: 7, abbreviation: "Project-1" },
  { code: "22ITC17", name: "Social Outreach", credits: 1, type: "P", semester: 7, abbreviation: "SO" },
  // Sem 8
  { code: "22MAO01", name: "Fundamentals of Quantum Computing", credits: 3, type: "T", semester: 8, abbreviation: "FQC" },
  { code: "22EGO01", name: "Technical Writing Skills", credits: 3, type: "T", semester: 8, abbreviation: "TWS" },
  { code: "22ITC27", name: "Technical Seminar", credits: 1, type: "P", semester: 8, abbreviation: "Seminar" },
  { code: "22ITC28", name: "Project Part-2", credits: 4, type: "P", semester: 8, abbreviation: "Project-2" },
];

// Faculty pool (IT department)
const FACULTY = [
  { id: "FAC001", name: "Dr. John Smith", designation: "Professor" },
  { id: "FAC002", name: "Dr. Sarah Johnson", designation: "Professor" },
  { id: "FAC003", name: "Mr. Michael Brown", designation: "Associate Professor" },
  { id: "FAC004", name: "Ms. Emily Davis", designation: "Assistant Professor" },
  { id: "FAC005", name: "Mr. Robert Wilson", designation: "Associate Professor" },
  { id: "FAC006", name: "Ms. Jennifer Lee", designation: "Assistant Professor" },
  { id: "FAC007", name: "Dr. Karthik Reddy", designation: "Professor" },
  { id: "FAC008", name: "Ms. Anjali Mehta", designation: "Assistant Professor" },
  { id: "FAC009", name: "Mr. Suresh Iyer", designation: "Lecturer" },
  { id: "FAC010", name: "Dr. Pooja Sharma", designation: "Associate Professor" },
];

// Student name pool – realistic Indian/diverse names
const STUDENT_NAMES = [
  "AMETI AKSHITHA", "HAMSAGOUNI RITHIKA", "KANDIMALLA SONY", "LAKSHANA S",
  "MEGHANA REDDY", "MEHERUNNISA", "NIMMALA MADHURI", "PRIYANSHU NERELLA",
  "PUTTY DHANUSHKA", "RIDA SHAIK", "SAMEEKSHA PADIGEL", "SHRAVYA JALLEPALLY",
  "SISTLA KEERTHANA", "ARJUN VARMA", "PRIYA SHARMA", "RAHUL KUMAR",
  "SNEHA REDDY", "VIKAS GUPTA", "ANANYA RAO", "KARTHIK MENON",
  "DIVYA NAIR", "ROHAN DESAI", "ISHA PATEL", "NIKHIL JOSHI",
  "TANVI KAPOOR", "ADITYA SINGH", "RIYA BANERJEE", "SAMEER KHAN",
  "POOJA MISHRA", "VIVEK CHOUDHARY",
];

// Section composition: each section gets 10 students (configurable)
const STUDENTS_PER_SECTION = 10;

// ─── Deterministic PRNG so seeding is stable across reloads ─────────────────
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

// ─── Roll-number generation (matching college pattern) ──────────────────────
// Pattern: 160<batchYY>737<NNN>  e.g., 160123737071 for batch 2023, student 71
const buildRoll = (startYear, idx) => {
  const yy = String(startYear).slice(-2);
  return `160${yy}737${String(idx).padStart(3, "0")}`;
};

// ─── Current/most-recent semester per batch ─────────────────────────────────
// Batch 2023-2027 → in 2026-27 academic year, currently Semester 6
// Batch 2024-2028 → in 2026-27 academic year, currently Semester 4
const batchCurrentSemester = (startYear) => {
  // Assume current academic year is the 4th year of progress
  // 2023 batch: 2026-27 → Sem 6 (Spring of year 3)
  // 2024 batch: 2026-27 → Sem 4
  return startYear === 2023 ? 6 : 4;
};

// ─── Build seed: one IT department, two batches, three sections each ───────
function buildSeedStore() {
  const department = {
    id: 1,
    name: "Information Technology",
    abbreviation: "IT",
  };

  const batches = [
    { id: "B-2023", startYear: 2023, endYear: 2027, name: "2023-2027" },
    { id: "B-2024", startYear: 2024, endYear: 2028, name: "2024-2028" },
  ];

  const sections = [];
  const students = [];

  for (const batch of batches) {
    let rollIdx = 1;
    for (const secName of ["IT1", "IT2", "IT3"]) {
      const sectionId = `${batch.id}-${secName}`;
      const currentSem = batchCurrentSemester(batch.startYear);
      const studentIds = [];
      for (let i = 0; i < STUDENTS_PER_SECTION; i++, rollIdx++) {
        const sid = `${batch.id}-${secName}-${rollIdx}`;
        studentIds.push(sid);
        students.push({
          id: sid,
          rollNumber: buildRoll(batch.startYear, rollIdx),
          name: STUDENT_NAMES[(rollIdx + (batch.startYear % 10) * 7) % STUDENT_NAMES.length],
          batchId: batch.id,
          sectionId,
          sectionName: secName,
        });
      }
      sections.push({
        id: sectionId,
        name: secName,
        batchId: batch.id,
        currentSemester: currentSem,
        studentIds,
      });
    }
  }

  // ── Random faculty ↔ subject ↔ section assignments ──
  // For each (batch, section, semester) we pick a curated subset of the
  // semester's catalogue: 4-6 theory subjects + 3-4 practical subjects.
  // Selection is deterministic per (batch, section, semester).
  const pickSubset = (pool, count, seedKey) => {
    const r = mulberry32(hashStr(seedKey));
    const arr = pool.slice();
    // Fisher–Yates with deterministic PRNG
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(count, arr.length));
  };

  const assignments = [];
  for (const batch of batches) {
    const upToSem = batchCurrentSemester(batch.startYear);
    for (let sem = 1; sem <= upToSem; sem++) {
      const semSubs = SUBJECTS.filter((s) => s.semester === sem);
      const theoryPool = semSubs.filter((s) => s.type === "T");
      const labPool = semSubs.filter((s) => s.type === "P");
      const sectionsOfBatch = sections.filter((s) => s.batchId === batch.id);
      for (const sec of sectionsOfBatch) {
        const rSel = mulberry32(hashStr(`SEL|${batch.id}|${sec.id}|${sem}`));
        const theoryCount = 4 + Math.floor(rSel() * 3); // 4..6
        const labCount = 3 + Math.floor(rSel() * 2);    // 3..4
        const chosenTheory = pickSubset(theoryPool, theoryCount, `T|${batch.id}|${sec.id}|${sem}`);
        const chosenLab = pickSubset(labPool, labCount, `P|${batch.id}|${sec.id}|${sem}`);
        const chosen = [...chosenTheory, ...chosenLab];
        for (const sub of chosen) {
          const seed = hashStr(`${batch.id}|${sec.id}|${sub.code}|${sem}`);
          const rand = mulberry32(seed);
          const fac = FACULTY[Math.floor(rand() * FACULTY.length)];
          assignments.push({
            id: `A-${batch.id}-${sec.name}-${sub.code}`,
            facultyId: fac.id,
            subjectCode: sub.code,
            sectionId: sec.id,
            batchId: batch.id,
            semester: sem,
            academicYear:
              sem === upToSem
                ? "2026-27"
                : `${batch.startYear + Math.floor((sem - 1) / 2)}-${String(batch.startYear + Math.floor((sem - 1) / 2) + 1).slice(-2)}`,
            studentIds: sec.studentIds.slice(),
          });
        }
      }
    }
  }

  // ── Random CIE marks per (assignment, student) ──
  // Theory components: slipTests[3]/5, assignments[2]/10, classTests[2]/20, attendance/5
  // Lab components:    weeklyCIE[3]/30, internalTests[2]/20
  const marks = {};
  for (const a of assignments) {
    const sub = SUBJECTS.find((s) => s.code === a.subjectCode);
    const isTheory = sub.type === "T";
    for (const sid of a.studentIds) {
      const seed = hashStr(`${a.id}|${sid}`);
      const r = mulberry32(seed);
      const skill = 0.55 + r() * 0.4; // student ability 55-95%
      const noise = () => (r() - 0.5) * 0.2; // ±10%
      const pct = () => Math.max(0, Math.min(1, skill + noise()));

      let entry;
      if (isTheory) {
        entry = {
          slipTests: [Math.round(pct() * 5), Math.round(pct() * 5), Math.round(pct() * 5)],
          assignments: [Math.round(pct() * 10), Math.round(pct() * 10)],
          classTests: [Math.round(pct() * 20), Math.round(pct() * 20)],
          attendance: Math.round(pct() * 5),
        };
      } else {
        entry = {
          weeklyCIE: [Math.round(pct() * 30), Math.round(pct() * 30), Math.round(pct() * 30)],
          internalTests: [Math.round(pct() * 20), Math.round(pct() * 20)],
        };
      }
      marks[`${a.id}|${sid}`] = entry;
    }
  }

  return { department, batches, sections, students, faculty: FACULTY, subjects: SUBJECTS, assignments, marks };
}

// ─── Persistence ────────────────────────────────────────────────────────────
let _cache = null;
export function getStore() {
  if (_cache) return _cache;
  if (typeof window === "undefined") return buildSeedStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { _cache = JSON.parse(raw); return _cache; }
  } catch {}
  _cache = buildSeedStore();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_cache)); } catch {}
  return _cache;
}
export function saveStore(store) {
  _cache = store;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
}
export function resetStore() {
  _cache = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  return getStore();
}

// ─── CIE calculators (single source of truth) ──────────────────────────────
export const CIE_MAX_THEORY = 40;
export const CIE_MAX_LAB = 50;

export function computeTheoryCIE(m) {
  if (!m) return { slipTest: 0, assignment: 0, classTest: 0, attendance: 0, total: 0 };
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const slipTest = avg(m.slipTests || []);
  const assignment = avg(m.assignments || []);
  const classTest = avg(m.classTests || []);
  const attendance = m.attendance || 0;
  return {
    slipTest: Math.round(slipTest * 10) / 10,
    assignment: Math.round(assignment * 10) / 10,
    classTest: Math.round(classTest * 10) / 10,
    attendance,
    total: Math.round((slipTest + assignment + classTest + attendance) * 10) / 10,
  };
}
export function computeLabCIE(m) {
  if (!m) return { weeklyCIE: 0, internalTests: 0, total: 0 };
  const sum = (a) => (a || []).reduce((x, y) => x + y, 0);
  const weeklyCIE = sum(m.weeklyCIE);
  const internalTests = sum(m.internalTests);
  return { weeklyCIE, internalTests, total: weeklyCIE + internalTests };
}
export function computeCIETotal(subjectType, marks) {
  return subjectType === "T" ? computeTheoryCIE(marks).total : computeLabCIE(marks).total;
}

// ─── Selectors ──────────────────────────────────────────────────────────────
export function getSubject(code) {
  return getStore().subjects.find((s) => s.code === code);
}
export function getStudent(studentId) {
  return getStore().students.find((s) => s.id === studentId);
}
export function getSection(sectionId) {
  return getStore().sections.find((s) => s.id === sectionId);
}
export function getBatch(batchId) {
  return getStore().batches.find((b) => b.id === batchId);
}
export function getStudentsInSection(sectionId) {
  const store = getStore();
  return store.students.filter((st) => st.sectionId === sectionId);
}

// All assignments where a faculty teaches
export function getAssignmentsForFaculty(facultyId) {
  return getStore().assignments.filter((a) => a.facultyId === facultyId);
}
// All assignments for a section, optional semester filter
export function getAssignmentsForSection(sectionId, semester) {
  return getStore().assignments.filter(
    (a) => a.sectionId === sectionId && (semester == null || a.semester === semester),
  );
}
// All assignments a student is enrolled in (semester-filtered)
export function getAssignmentsForStudent(studentId, semester) {
  return getStore().assignments.filter(
    (a) =>
      a.studentIds.includes(studentId) &&
      (semester == null || a.semester === semester),
  );
}

export function getMarks(assignmentId, studentId) {
  return getStore().marks[`${assignmentId}|${studentId}`] || null;
}
export function setMarks(assignmentId, studentId, patch) {
  const store = getStore();
  const key = `${assignmentId}|${studentId}`;
  store.marks[key] = { ...(store.marks[key] || {}), ...patch };
  saveStore(store);
}

// Update a single assessment (e.g., classtest1) for many students at once.
// component examples: 'sliptest1' 'assignment2' 'classtest1' 'attendance'
//                     'weeklycie1' 'internaltest2'
export function updateAssessment(assignmentId, component, valuesByStudentId) {
  const store = getStore();
  for (const [sid, val] of Object.entries(valuesByStudentId)) {
    const key = `${assignmentId}|${sid}`;
    const m = store.marks[key] || {};
    const num = val === "" || val == null ? null : Number(val);
    if (component.startsWith("sliptest")) {
      const idx = parseInt(component.replace("sliptest", ""), 10) - 1;
      m.slipTests = m.slipTests ? [...m.slipTests] : [0, 0, 0];
      m.slipTests[idx] = num ?? 0;
    } else if (component.startsWith("assignment")) {
      const idx = parseInt(component.replace("assignment", ""), 10) - 1;
      m.assignments = m.assignments ? [...m.assignments] : [0, 0];
      m.assignments[idx] = num ?? 0;
    } else if (component.startsWith("classtest")) {
      const idx = parseInt(component.replace("classtest", ""), 10) - 1;
      m.classTests = m.classTests ? [...m.classTests] : [0, 0];
      m.classTests[idx] = num ?? 0;
    } else if (component === "attendance") {
      m.attendance = num ?? 0;
    } else if (component.startsWith("weeklycie")) {
      const idx = parseInt(component.replace("weeklycie", ""), 10) - 1;
      m.weeklyCIE = m.weeklyCIE ? [...m.weeklyCIE] : [0, 0, 0];
      m.weeklyCIE[idx] = num ?? 0;
    } else if (component.startsWith("internaltest")) {
      const idx = parseInt(component.replace("internaltest", ""), 10) - 1;
      m.internalTests = m.internalTests ? [...m.internalTests] : [0, 0];
      m.internalTests[idx] = num ?? 0;
    }
    store.marks[key] = m;
  }
  saveStore(store);
}

// Build the semesterData shape expected by Student dashboard / analytics
// for a given studentId.
export function buildStudentSemesterData(studentId) {
  const store = getStore();
  const result = {};
  for (let sem = 1; sem <= 8; sem++) {
    const myAssignments = store.assignments.filter(
      (a) => a.studentIds.includes(studentId) && a.semester === sem,
    );
    result[sem] = {
      subjects: myAssignments.map((a) => {
        const sub = store.subjects.find((s) => s.code === a.subjectCode);
        const m = store.marks[`${a.id}|${studentId}`] || {};
        const isTheory = sub.type === "T";
        return {
          courseCode: sub.code,
          name: sub.name,
          type: isTheory ? "theory" : "lab",
          credits: sub.credits,
          marks: isTheory
            ? {
                slipTests: m.slipTests || [0, 0, 0],
                assignments: m.assignments || [0, 0],
                classTests: m.classTests || [0, 0],
                attendance: m.attendance || 0,
              }
            : {
                weeklyCIE: m.weeklyCIE || [0, 0, 0],
                internalTests: m.internalTests || [0, 0],
              },
          grade: null,
          assignmentId: a.id,
          facultyId: a.facultyId,
        };
      }),
    };
  }
  return result;
}

// Default identity for demo logins
export const DEFAULT_FACULTY_ID = "FAC001";
export function getDefaultStudentId() {
  // Pick first student of batch 2023, IT1
  const s = getStore().students.find((st) => st.sectionId === "B-2023-IT1");
  return s?.id;
}
