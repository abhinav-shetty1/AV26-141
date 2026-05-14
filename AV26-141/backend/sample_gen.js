const XLSX = require('xlsx');
const path = require('path');

const data = [
  {
    name: "John Doe",
    email: "john@student.edu",
    roll_no: "STU001",
    class: "10",
    section: "A",
    math_score: 85,
    science_score: 78,
    english_score: 92,
    kannada_score: 88,
    social_score: 80,
    exam_type: "midterm",
    exam_date: "2024-05-10",
    attendance_total: 30,
    attendance_present: 28,
    assignments_total: 10,
    assignments_submitted: 9,
    month: "2024-05"
  },
  {
    name: "Jane Smith",
    email: "jane@student.edu",
    roll_no: "STU002",
    class: "10",
    section: "A",
    math_score: 30,
    science_score: 32,
    english_score: 45,
    kannada_score: 28,
    social_score: 35,
    exam_type: "midterm",
    exam_date: "2024-05-10",
    attendance_total: 30,
    attendance_present: 15,
    assignments_total: 10,
    assignments_submitted: 4,
    month: "2024-05"
  },
  {
    name: "Bob Wilson",
    email: "bob@student.edu",
    roll_no: "STU003",
    class: "10",
    section: "B",
    math_score: 65,
    science_score: 40,
    english_score: 55,
    kannada_score: 70,
    social_score: 60,
    exam_type: "midterm",
    exam_date: "2024-05-10",
    attendance_total: 30,
    attendance_present: 22,
    assignments_total: 10,
    assignments_submitted: 7,
    month: "2024-05"
  }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Students");

const filePath = path.join(__dirname, 'sample_students.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Created sample Excel file at: ${filePath}`);
