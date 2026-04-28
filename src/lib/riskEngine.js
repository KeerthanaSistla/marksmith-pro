/**
 * IntelliGrade — At-Risk Student Detection Engine (Client-Side)
 *
 * Standardised 3-category model:  Safe  |  At Risk  |  Critical
 *
 *   Critical : credit-weighted CIE avg < 45%   OR  ≥ 2 failed subjects (<40%)
 *   At Risk  : credit-weighted CIE avg < 55%   OR  ≥ 1 failed subject
 *   Safe     : everything else
 *
 * A "risk score" (0-100) is also produced for sorting/visualisation, but the
 * category above is the single source of truth that every UI uses.
 */

// ─── Thresholds (single source of truth) ───────────────────────────────────
export const FAIL_PCT = 40;          // CIE % below which a subject is "failed"
export const CRITICAL_AVG_PCT = 45;
export const AT_RISK_AVG_PCT = 55;
export const CRITICAL_FAIL_COUNT = 2;

// ─── Category metadata (used by every chart/badge) ─────────────────────────
export const CATEGORIES = {
  Safe:       { color: "hsl(142, 71%, 45%)", hex: "#16A34A", bgClass: "bg-accent",     textClass: "text-accent" },
  "At Risk":  { color: "hsl(38, 92%, 50%)",  hex: "#F59E0B", bgClass: "bg-warning",    textClass: "text-warning" },
  Critical:   { color: "hsl(0, 84%, 50%)",   hex: "#DC2626", bgClass: "bg-destructive",textClass: "text-destructive" },
};
export const CATEGORY_ORDER = ["Critical", "At Risk", "Safe"];

// Legacy alias (kept so any old imports don't break)
export const TIERS = CATEGORIES;
export const TIER_ORDER = CATEGORY_ORDER;

export function getIntervention(category) {
  if (category === "Critical") return "Immediate";
  if (category === "At Risk") return "This week";
  return "Monitor";
}

// ─── CIE calculators ───────────────────────────────────────────────────────
function calculateTheoryCIE(m) {
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const slips = (m.slipTests || []).slice().sort((a, b) => b - a).slice(0, 2);
  return avg(slips) + avg(m.assignments) + avg(m.classTests) + (m.attendance || 0);
}
function calculateLabCIE(m) {
  const avg = (a) => (a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  // Cap at 50 — lab CIE max is 50 marks (avg weekly /30 + avg internal /20).
  return Math.min(50, avg(m.weeklyCIE) + avg(m.internalTests));
}
function getMaxCIE(type) { return type === "theory" ? 40 : 50; }

function getCIEPct(subject) {
  const cie = subject.type === "theory" ? calculateTheoryCIE(subject.marks) : calculateLabCIE(subject.marks);
  return (cie / getMaxCIE(subject.type)) * 100;
}

// ─── Categorise a single student ───────────────────────────────────────────
export function categoriseStudent(student) {
  let totalCredits = 0;
  let weightedSum = 0;
  let failCount = 0;
  const subjectCIEs = {};
  const failSubjects = [];

  student.subjects.forEach((sub) => {
    const cie = sub.type === "theory" ? calculateTheoryCIE(sub.marks) : calculateLabCIE(sub.marks);
    const max = getMaxCIE(sub.type);
    const pct = (cie / max) * 100;
    subjectCIEs[sub.courseCode] = { cie, pct, subject: sub };

    if (sub.credits > 0) {
      totalCredits += sub.credits;
      weightedSum += sub.credits * pct;
    }
    if (pct < FAIL_PCT) {
      failCount += 1;
      failSubjects.push({ code: sub.courseCode, name: sub.name, cie, max, pct });
    }
  });

  const avgPct = totalCredits > 0 ? weightedSum / totalCredits : 0;

  let category;
  if (avgPct < CRITICAL_AVG_PCT || failCount >= CRITICAL_FAIL_COUNT) category = "Critical";
  else if (avgPct < AT_RISK_AVG_PCT || failCount >= 1) category = "At Risk";
  else category = "Safe";

  // Risk score (0-100) derived from category + avg, used only for sort/charts.
  let score;
  if (category === "Critical") score = Math.round(75 + Math.max(0, (CRITICAL_AVG_PCT - avgPct)) * 1.2 + failCount * 3);
  else if (category === "At Risk") score = Math.round(45 + Math.max(0, (AT_RISK_AVG_PCT - avgPct)) * 1.5 + failCount * 4);
  else score = Math.max(1, Math.round(30 - (avgPct - AT_RISK_AVG_PCT) * 0.5));
  score = Math.max(1, Math.min(100, score));

  const flags = [];
  if (failSubjects.length > 0) {
    flags.push(`Failing: ${failSubjects.map((s) => `${s.name} (${s.cie.toFixed(0)}/${s.max})`).join(", ")}`);
  }
  if (avgPct < CRITICAL_AVG_PCT) flags.push(`Overall avg ${avgPct.toFixed(1)}% — critical`);
  else if (avgPct < AT_RISK_AVG_PCT) flags.push(`Overall avg ${avgPct.toFixed(1)}% — below safe threshold`);
  if (failCount >= 2) flags.push(`${failCount} subject failures`);

  return {
    id: student.id,
    name: student.name,
    rollNo: student.rollNo,
    category,
    tier: category, // legacy alias for old UI
    score,
    avgPct: Math.round(avgPct * 10) / 10,
    failCount,
    failSubjects,
    flags,
    intervention: getIntervention(category),
    subjectCIEs,
  };
}

/**
 * Compute risk for a class. Returns ALL students (categorised) plus rollups.
 */
export function computeRiskScores(students) {
  if (!students || students.length === 0) {
    return {
      allStudents: [],
      riskStudents: [],
      subjectStats: [],
      summary: { total: 0, atRisk: 0, safe: 0, critical: 0, categories: { Safe: 0, "At Risk": 0, Critical: 0 } },
    };
  }

  const allStudents = students.map(categoriseStudent).sort((a, b) => b.score - a.score);
  const riskStudents = allStudents.filter((s) => s.category !== "Safe");

  // Subject-level stats
  const allSubjects = {};
  students.forEach((s) => {
    s.subjects.forEach((sub) => {
      if (!allSubjects[sub.courseCode]) {
        allSubjects[sub.courseCode] = { ...sub, cieScores: [] };
      }
      const cie = sub.type === "theory" ? calculateTheoryCIE(sub.marks) : calculateLabCIE(sub.marks);
      allSubjects[sub.courseCode].cieScores.push(cie);
    });
  });

  const subjectStats = Object.entries(allSubjects).map(([code, subData]) => {
    const scores = subData.cieScores;
    const max = getMaxCIE(subData.type);
    const failCount = scores.filter((s) => (s / max) * 100 < FAIL_PCT).length;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      code,
      name: subData.name,
      type: subData.type,
      credits: subData.credits,
      maxMark: max,
      failures: failCount,
      classMean: Math.round(mean * 10) / 10,
      classMeanPct: Math.round((mean / max) * 100 * 10) / 10,
      passRate: Math.round((1 - failCount / scores.length) * 100 * 10) / 10,
    };
  }).sort((a, b) => b.failures - a.failures);

  const categories = { Safe: 0, "At Risk": 0, Critical: 0 };
  allStudents.forEach((s) => { categories[s.category] += 1; });

  return {
    allStudents,
    riskStudents,
    subjectStats,
    summary: {
      total: students.length,
      safe: categories.Safe,
      atRisk: categories["At Risk"],
      critical: categories.Critical,
      categories,
      // legacy field used by older UI bits
      tiers: categories,
    },
  };
}

/**
 * Predict likely final grade from CIE marks. Used on student dashboard.
 */
export function predictPerformance(subject) {
  const ciePct = getCIEPct(subject);
  const predictedTotal = ciePct * 0.85 + 15;
  const confidence = Math.min(95, Math.max(40, 50 + (ciePct - 50) * 0.9));

  let predictedGrade;
  if (predictedTotal >= 90) predictedGrade = "S";
  else if (predictedTotal >= 80) predictedGrade = "A";
  else if (predictedTotal >= 70) predictedGrade = "B";
  else if (predictedTotal >= 60) predictedGrade = "C";
  else if (predictedTotal >= 50) predictedGrade = "D";
  else predictedGrade = "F";

  let trend = "Stable";
  if (subject.type === "theory") {
    const { slipTests, classTests } = subject.marks;
    const earlyAvg = slipTests[0];
    const lateAvg = slipTests[slipTests.length - 1];
    const classAvg = classTests.reduce((a, b) => a + b, 0) / classTests.length;
    if (lateAvg > earlyAvg && classAvg > 14) trend = "Improving";
    else if (lateAvg < earlyAvg || classAvg < 10) trend = "Declining";
  }

  return {
    ciePct: Math.round(ciePct * 10) / 10,
    predictedTotal: Math.round(predictedTotal * 10) / 10,
    predictedGrade,
    confidence: Math.round(confidence),
    trend,
  };
}

/**
 * Personal risk profile across semesters.
 */
export function computeStudentRiskProfile(semesterData, grades) {
  const semesterRisks = [];

  Object.entries(semesterData).forEach(([sem, data]) => {
    if (!data.subjects || data.subjects.length === 0) return;

    let totalCIE = 0;
    let totalMax = 0;
    const predictions = [];

    data.subjects.forEach((sub) => {
      const cie = sub.type === "theory" ? calculateTheoryCIE(sub.marks) : calculateLabCIE(sub.marks);
      const max = getMaxCIE(sub.type);
      totalCIE += cie;
      totalMax += max;

      const pred = predictPerformance(sub);
      predictions.push({
        courseCode: sub.courseCode,
        name: sub.name,
        type: sub.type,
        credits: sub.credits,
        cie: Math.round(cie * 10) / 10,
        maxCIE: max,
        ciePct: pred.ciePct,
        predictedGrade: pred.predictedGrade,
        actualGrade: grades[`${sem}-${sub.courseCode}`] || null,
        confidence: pred.confidence,
        trend: pred.trend,
        predictedTotal: pred.predictedTotal,
      });
    });

    const overallPct = totalMax > 0 ? (totalCIE / totalMax) * 100 : 0;

    semesterRisks.push({
      semester: parseInt(sem),
      overallPct: Math.round(overallPct * 10) / 10,
      predictions,
      subjectCount: data.subjects.length,
    });
  });

  return semesterRisks.sort((a, b) => a.semester - b.semester);
}
