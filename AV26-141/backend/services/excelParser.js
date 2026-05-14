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

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  console.log('--- EXCEL DATA DEBUG ---');
  console.log('First 2 rows:', data.slice(0, 2));
  console.log('Total rows:', data.length);

  // If the first row looks like headers, we'll use them. 
  // Otherwise, we map by position (A=0, B=1, etc.)
  const firstRow = data[0] || [];
  const hasHeaders = firstRow.some(cell => 
    ['name', 'email', 'math', 'science', 'roll'].includes(String(cell).toLowerCase().trim())
  );

  const finalRows = [];
  const startIndex = hasHeaders ? 1 : 0;

  for (let i = startIndex; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1]) continue; // Skip empty rows

    const obj = {};
    if (hasHeaders) {
      // Use header names
      firstRow.forEach((header, idx) => {
        const key = String(header).trim().toLowerCase().replace(/\s+/g, '_');
        obj[key] = row[idx];
      });
    } else {
      // Map by standard position from your screenshot
      obj['full_name']             = row[0];
      obj['email']                 = row[1];
      obj['roll_no']               = row[2];
      obj['class']                 = row[3];
      obj['section']               = row[4];
      obj['maths']                 = row[5];
      obj['science']               = row[6];
      obj['english']               = row[7];
      obj['kannada']               = row[8];
      obj['social_sci']            = row[9];
      obj['exam_type']             = row[10];
      obj['exam_date']             = row[11];
      obj['attendance_total']      = row[12];
      obj['attendance_present']    = row[13];
      obj['assignments_total']     = row[14];
      obj['assignments_submitted'] = row[15];
      obj['month']                 = row[16];
    }
    finalRows.push(obj);
  }

  return finalRows;
}

module.exports = { parseExcel };
