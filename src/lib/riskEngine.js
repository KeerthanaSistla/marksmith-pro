/**
 * IntelliGrade — At-Risk Student Detection Engine (Client-Side)
 * Adapted from the Python IntelliGrade v2 system.
 * 
 * Weighted Risk Score | 4-Tier Classification | Subject-Level Analysis
 */

// ─── Risk Score Weights ───
const W_FAILING_SUBJECT = 15;
const W_HIGH_CREDIT_FAIL = 8;
const W_LOW_PERCENTILE = 3;
const W_LOW_OVERALL_AVG = 20;
const W_MODERATE_AVG = 10;
const W_MULTI_LAB_FAIL = 10;

// ─── Thresholds ───
const FAIL_PCT = 40;
const HIGH_CREDIT_RISK_PCT = 50;
const LOW_PERCENTILE_CUT = 25;
const LOW_AVG_PCT = 50;
const MOD_AVG_PCT = 60;

// ─── Tier mapping ───
export const TIERS = {
  Critical: { lo: 75, hi: 100, color: "hsl(var(--destructive))", bgClass: "bg-destructive", textClass: "text-destructive", hex: "#C0392B" },
  High:     { lo: 50, hi: 74,  color: "hsl(25, 75%, 52%)",       bgClass: "bg-warning",     textClass: "text-warning",     hex: "#E67E22" },
  Moderate: { lo: 25, hi: 49,  color: "hsl(48, 89%, 56%)",       bgClass: "bg-yellow-400",  textClass: "text-yellow-600",  hex: "#F1C40F" },
  Watch:    { lo: 1,  hi: 24,  color: "hsl(var(--accent))",      bgClass: "bg-accent",      textClass: "text-accent",      hex: "#27AE60" },
};

export const TIER_ORDER = ["Critical", "High", "Moderate", "Watch"];

export function getTier(score) {
  for (const [tier, { lo, hi }] of Object.entries(TIERS)) {
    if (score >= lo && score <= hi) return tier;
  }
  return null;
}

export function getIntervention(tier) {
  if (tier === "Critical") return "Immediate";
  if (tier === "High") return "This week";
  if (tier === "Moderate") return "This month";
  return "Monitor";
}

// ─── CIE calculation helpers ───
function calculateTheoryCIE(marks) {
  const avgSlip = marks.slipTests.reduce((a, b) => a + b, 0) / marks.slipTests.length;
  const avgAssign = marks.assignments.reduce((a, b) => a + b, 0) / marks.assignments.length;
  const avgClass = marks.classTests.reduce((a, b) => a + b, 0) / marks.classTests.length;
  return avgSlip + avgAssign + avgClass + marks.attendance;
}

function calculateLabCIE(marks) {
  const weeklyTotal = marks.weeklyCIE.reduce((a, b) => a + b, 0);
  const internalTotal = marks.internalTests.reduce((a, b) => a + b, 0);
  return weeklyTotal + internalTotal;
}

function getMaxCIE(type) {
  return type === "theory" ? 40 : 50;
}

function getCIEPct(subject) {
  const cie = subject.type === "theory"
    ? calculateTheoryCIE(subject.marks)
    : calculateLabCIE(subject.marks);
  return (cie / getMaxCIE(subject.type)) * 100;
}

// ─── Percentile calculation ───
function percentileRank(values, index) {
  const val = values[index];
  const below = values.filter(v => v < val).length;
  return (below / values.length) * 100;
}

/**
 * Compute risk scores for an array of students.
 * Each student: { id, name, rollNo, subjects: [{ courseCode, name, type, credits, marks }] }
 * Returns: { riskStudents, subjectStats, summary }
 */
export function computeRiskScores(students) {
  if (!students || students.length === 0) {
    return { riskStudents: [], subjectStats: [], summary: { total: 0, atRisk: 0, safe: 0, tiers: {} } };
  }

  // Gather all unique subjects
  const allSubjects = {};
  students.forEach(s => {
    s.subjects.forEach(sub => {
      if (!allSubjects[sub.courseCode]) {
        allSubjects[sub.courseCode] = { ...sub, cieScores: [] };
      }
    });
  });

  // Compute CIE for each student×subject
  const studentCIEs = students.map(student => {
    const cies = {};
    student.subjects.forEach(sub => {
      const cie = sub.type === "theory" ? calculateTheoryCIE(sub.marks) : calculateLabCIE(sub.marks);
      cies[sub.courseCode] = { cie, pct: (cie / getMaxCIE(sub.type)) * 100, subject: sub };
      if (allSubjects[sub.courseCode]) {
        allSubjects[sub.courseCode].cieScores.push(cie);
      }
    });
    return { student, cies };
  });

  // Compute percentile ranks per subject
  const percentiles = {};
  Object.entries(allSubjects).forEach(([code, subData]) => {
    const sorted = [...subData.cieScores].sort((a, b) => a - b);
    percentiles[code] = sorted;
  });

  // Score each student
  const riskStudents = [];

  studentCIEs.forEach(({ student, cies }) => {
    let score = 0;
    const flags = [];
    const failSubjects = [];
    const hcRiskSubjects = [];
    const lowPctileSubjects = [];
    const labFailSubjects = [];

    // Credit-weighted average
    let totalCredits = 0;
    let weightedSum = 0;

    Object.entries(cies).forEach(([code, { cie, pct, subject }]) => {
      const maxCIE = getMaxCIE(subject.type);
      const isLab = subject.type === "lab";

      totalCredits += subject.credits;
      weightedSum += subject.credits * pct;

      // Failing?
      if (pct < FAIL_PCT) {
        failSubjects.push({ code, name: subject.name, cie, max: maxCIE, pct });
        score += W_FAILING_SUBJECT;
        if (isLab) labFailSubjects.push(code);
      }

      // High-credit risk?
      if (subject.credits >= 3 && pct < HIGH_CREDIT_RISK_PCT) {
        hcRiskSubjects.push({ code, name: subject.name, cie, max: maxCIE, pct });
        score += W_HIGH_CREDIT_FAIL;
      }

      // Low percentile?
      const subjScores = percentiles[code] || [];
      if (subjScores.length > 1) {
        const rank = (subjScores.filter(v => v < cie).length / subjScores.length) * 100;
        if (rank <= LOW_PERCENTILE_CUT) {
          lowPctileSubjects.push({ code, name: subject.name, rank: Math.round(rank) });
          score += W_LOW_PERCENTILE;
        }
      }
    });

    // Multi-lab failure
    if (labFailSubjects.length >= 2) score += W_MULTI_LAB_FAIL;

    // Overall average
    const avgPct = totalCredits > 0 ? weightedSum / totalCredits : 0;
    if (avgPct < LOW_AVG_PCT) score += W_LOW_OVERALL_AVG;
    else if (avgPct < MOD_AVG_PCT) score += W_MODERATE_AVG;

    score = Math.min(score, 100);
    const tier = getTier(score);

    if (tier) {
      if (failSubjects.length > 0) flags.push(`Failing: ${failSubjects.map(s => `${s.name} (${s.cie.toFixed(0)}/${s.max})`).join(", ")}`);
      if (hcRiskSubjects.length > 0 && failSubjects.length === 0) flags.push(`High-credit risk: ${hcRiskSubjects.map(s => `${s.name}`).join(", ")}`);
      if (labFailSubjects.length >= 2) flags.push(`Multiple lab failures (${labFailSubjects.length})`);
      if (lowPctileSubjects.length > 0) flags.push(`Bottom ${LOW_PERCENTILE_CUT}th percentile in ${lowPctileSubjects.length} subjects`);
      if (avgPct < LOW_AVG_PCT) flags.push(`Overall avg ${avgPct.toFixed(1)}% < ${LOW_AVG_PCT}%`);
      else if (avgPct < MOD_AVG_PCT) flags.push(`Overall avg ${avgPct.toFixed(1)}% < ${MOD_AVG_PCT}%`);

      riskStudents.push({
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        tier,
        score,
        avgPct: Math.round(avgPct * 10) / 10,
        failCount: failSubjects.length,
        hcRiskCount: hcRiskSubjects.length,
        lowPctileCount: lowPctileSubjects.length,
        labFailCount: labFailSubjects.length,
        failSubjects,
        hcRiskSubjects,
        lowPctileSubjects,
        flags,
        intervention: getIntervention(tier),
        subjectCIEs: cies,
      });
    }
  });

  riskStudents.sort((a, b) => b.score - a.score || a.avgPct - b.avgPct);

  // Subject-level stats
  const subjectStats = Object.entries(allSubjects).map(([code, subData]) => {
    const scores = subData.cieScores;
    const max = getMaxCIE(subData.type);
    const failCount = scores.filter(s => (s / max) * 100 < FAIL_PCT).length;
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

  // Summary
  const tierCounts = {};
  TIER_ORDER.forEach(t => { tierCounts[t] = riskStudents.filter(s => s.tier === t).length; });

  return {
    riskStudents,
    subjectStats,
    summary: {
      total: students.length,
      atRisk: riskStudents.length,
      safe: students.length - riskStudents.length,
      tiers: tierCounts,
    },
  };
}

/**
 * Simple performance prediction based on CIE trends.
 * Given a student's CIE marks across components, predict likely final grade.
 */
export function predictPerformance(subject) {
  const ciePct = getCIEPct(subject);

  // Weighted prediction: CIE performance strongly correlates with final outcome
  // Apply a regression-like adjustment (students typically perform slightly better in SEE)
  const predictedTotal = ciePct * 0.85 + 15; // baseline adjustment
  const confidence = Math.min(95, Math.max(40, 50 + (ciePct - 50) * 0.9));

  let predictedGrade;
  if (predictedTotal >= 90) predictedGrade = "S";
  else if (predictedTotal >= 80) predictedGrade = "A";
  else if (predictedTotal >= 70) predictedGrade = "B";
  else if (predictedTotal >= 60) predictedGrade = "C";
  else if (predictedTotal >= 50) predictedGrade = "D";
  else predictedGrade = "F";

  // Trend analysis from component scores
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
 * Compute a personal risk profile for a single student across semesters.
 */
export function computeStudentRiskProfile(semesterData, grades) {
  const semesterRisks = [];

  Object.entries(semesterData).forEach(([sem, data]) => {
    if (!data.subjects || data.subjects.length === 0) return;

    let totalCIE = 0;
    let totalMax = 0;
    const predictions = [];

    data.subjects.forEach(sub => {
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
