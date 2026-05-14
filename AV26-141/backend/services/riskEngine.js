/**
 * Risk Score = (Attendance% × 0.35) + (Grade Avg × 0.40) + (Assignment% × 0.25)
 * 75–100 → safe | 50–74 → at_risk | 0–49 → critical
 */
function calculateRisk(attendancePct, gradeAvg, assignmentPct) {
  const score =
    (Number(attendancePct)  * 0.35) +
    (Number(gradeAvg)       * 0.40) +
    (Number(assignmentPct)  * 0.25);

  const rounded = Math.round(score * 100) / 100;

  const level =
    rounded >= 75 ? 'safe' :
    rounded >= 50 ? 'at_risk' : 'critical';

  return { score: rounded, level };
}

/**
 * Build warning notifications for the student dashboard.
 * Returns an array of warning strings (empty = all good).
 *
 * @param {Array}  grades          - rows from grades table [{ subject, score }]
 * @param {number} attendancePct   - e.g. 68.5
 * @param {number} avgMarks        - average across all subjects
 */
function buildStudentNotifications(grades, attendancePct, avgMarks) {
  const warnings = [];

  if (Number(avgMarks) < 35) {
    warnings.push(`Your overall average (${Number(avgMarks).toFixed(1)}%) is below the 35% pass mark.`);
  }

  if (Number(attendancePct) < 75) {
    warnings.push(`Your attendance (${Number(attendancePct).toFixed(1)}%) is below the required 75%.`);
  }

  // Check each subject individually
  const subjectMap = {};
  for (const g of grades) {
    // Group by subject — take latest (highest id) if multiple exams
    if (!subjectMap[g.subject] || g.id > subjectMap[g.subject].id) {
      subjectMap[g.subject] = g;
    }
  }
  for (const [subject, g] of Object.entries(subjectMap)) {
    if (Number(g.score) < 35) {
      const label = subject.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      warnings.push(`Your score in ${label} (${g.score}%) is below 35%.`);
    }
  }

  return warnings;
}

/**
 * Build an alert message for a teacher when a student is at-risk.
 */
function buildAlertMessage(studentName, risk, subjects, attendancePct) {
  const lowSubjects = subjects
    .filter(s => Number(s.score) < 35)
    .map(s => s.subject.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

  const parts = [];
  if (lowSubjects.length)            parts.push(`Low scores in: ${lowSubjects.join(', ')}`);
  if (Number(attendancePct) < 75)    parts.push(`Attendance at ${Number(attendancePct).toFixed(1)}%`);
  if (!parts.length)                 parts.push(`Risk score: ${risk.score}`);

  return `${studentName} needs attention — ${parts.join('; ')}`;
}

module.exports = { calculateRisk, buildStudentNotifications, buildAlertMessage };
