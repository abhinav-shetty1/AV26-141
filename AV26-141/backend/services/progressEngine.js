/**
 * Progress = (avg_marks × 0.5) + (attendance% × 0.3) + (assignment_completion% × 0.2)
 * Returns a value from 0–100.
 */
function calculateProgress(avgMarks, attendancePct, assignmentPct) {
  const progress =
    (Number(avgMarks)      * 0.5) +
    (Number(attendancePct) * 0.3) +
    (Number(assignmentPct) * 0.2);

  return Math.round(Math.min(100, Math.max(0, progress)) * 10) / 10;
}

module.exports = { calculateProgress };
