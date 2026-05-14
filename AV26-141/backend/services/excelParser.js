const XLSX = require('xlsx');

/**
 * Parses a .xlsx file and returns an array of row objects.
 * Column headers in the Excel sheet become object keys.
 *
 * Expected columns (case-insensitive after trim):
 *   name, email, roll_no, class, section,
 *   math_score, science_score, english_score, kannada_score, social_score,
 *   exam_type, exam_date,
 *   attendance_total, attendance_present,
 *   assignments_total, assignments_submitted,
 *   month
 */
function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // raw: false → numbers stay as numbers
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

  // Normalise keys: trim whitespace, lowercase
  return rows.map(row => {
    const clean = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k.trim().toLowerCase().replace(/\s+/g, '_')] = v;
    }
    return clean;
  });
}

module.exports = { parseExcel };
