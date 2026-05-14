import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { apiFetch } from "../../lib/api";

const SUBJECT_LABELS = {
  mathematics:    "Maths",
  science:        "Science",
  english:        "English",
  kannada:        "Kannada",
  social_science: "Social Sci",
};

const EXAM_LABELS = { unit1: "Unit 1", unit2: "Unit 2", midterm: "Midterm", final: "Final" };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  return (
    <div style={{
      background: "rgba(5,30,15,0.95)", border: "1px solid rgba(52,211,153,0.25)",
      borderRadius: 10, padding: "10px 14px",
    }}>
      <p style={{ color: "#6ee7b7", fontSize: 12, marginBottom: 4 }}>{label}</p>
      <p style={{ color: score < 35 ? "#f87171" : "#34d399", fontWeight: 700, fontSize: 18 }}>{score}%</p>
    </div>
  );
}

export default function MyGrades({ theme }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExam, setSelectedExam] = useState("all");

  useEffect(() => {
    apiFetch("/api/student/grades")
      .then(setGrades)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <p style={{ color: "#6ee7b7" }}>Loading grades…</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: "2rem" }}>
      <div style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 12, padding: "1rem", color: "#f87171" }}>
        {error}
      </div>
    </div>
  );

  const examTypes = [...new Set(grades.map(g => g.exam_type))];
  const filtered  = selectedExam === "all" ? grades : grades.filter(g => g.exam_type === selectedExam);

  // Latest score per subject for bar chart
  const chartData = Object.entries(SUBJECT_LABELS).map(([key, label]) => {
    const rows = filtered.filter(g => g.subject === key);
    const latest = rows.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0];
    return { subject: label, score: latest ? Number(latest.score) : 0 };
  });

  const glass = {
    background: "rgba(5,30,15,0.50)", backdropFilter: "blur(18px) saturate(180%)",
    border: "1px solid rgba(52,211,153,0.18)", borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", fontFamily: "'Inter',sans-serif" }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        My Grades
      </h1>

      {/* Exam type filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["all", ...examTypes].map(et => (
          <button
            key={et}
            onClick={() => setSelectedExam(et)}
            style={{
              padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.2s",
              background: selectedExam === et ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(16,185,129,0.08)",
              border: selectedExam === et ? "1px solid #10b981" : "1px solid rgba(52,211,153,0.2)",
              color: selectedExam === et ? "#ecfdf5" : "#6ee7b7",
              boxShadow: selectedExam === et ? "0 0 16px rgba(16,185,129,0.3)" : "none",
            }}
          >
            {et === "all" ? "All Exams" : (EXAM_LABELS[et] || et)}
          </button>
        ))}
      </div>

      {/* Bar Chart */}
      <div style={{ ...glass, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Score by Subject
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <XAxis dataKey="subject" tick={{ fill: "#6ee7b7", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#34786a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
            <ReferenceLine y={35} stroke="#f87171" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: "Pass (35)", fill: "#f87171", fontSize: 11 }} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.score < 35 ? "#f87171" : entry.score < 60 ? "#fbbf24" : "#10b981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grades Table */}
      <div style={{ ...glass, padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          All Results
        </h2>
        {filtered.length === 0 ? (
          <p style={{ color: "#34786a", fontSize: 13 }}>No grades found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Subject", "Score", "Exam", "Date", "Status"].map(h => (
                    <th key={h} style={{ color: "#34786a", fontWeight: 600, textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(52,211,153,0.12)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => {
                  const score = Number(g.score);
                  const passed = score >= 35;
                  return (
                    <tr key={g.id} style={{ borderBottom: "1px solid rgba(52,211,153,0.06)" }}>
                      <td style={{ padding: "10px 12px", color: "#ecfdf5" }}>{SUBJECT_LABELS[g.subject] || g.subject}</td>
                      <td style={{ padding: "10px 12px", color: passed ? "#34d399" : "#f87171", fontWeight: 700 }}>{score}%</td>
                      <td style={{ padding: "10px 12px", color: "#6ee7b7" }}>{EXAM_LABELS[g.exam_type] || g.exam_type}</td>
                      <td style={{ padding: "10px 12px", color: "#34786a" }}>{g.exam_date}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: passed ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)",
                          color: passed ? "#34d399" : "#f87171",
                          border: `1px solid ${passed ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                        }}>
                          {passed ? "Pass" : "Fail"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}