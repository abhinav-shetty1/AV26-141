import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const SUBJECTS = {
  mathematics:    "Mathematics",
  science:        "Science",
  english:        "English",
  kannada:        "Kannada",
  social_science: "Social Science",
};

const RISK_STYLE = {
  safe:     { bg: "rgba(16,185,129,0.12)", color: "#34d399",  border: "rgba(52,211,153,0.3)",  label: "Safe" },
  at_risk:  { bg: "rgba(251,191,36,0.12)", color: "#fbbf24",  border: "rgba(251,191,36,0.3)",  label: "At Risk" },
  critical: { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)", label: "Critical" },
};

function StatCard({ label, value, unit = "", color = "#34d399" }) {
  return (
    <div style={{
      background: "rgba(5,30,15,0.50)",
      backdropFilter: "blur(18px) saturate(180%)",
      border: "1px solid rgba(52,211,153,0.18)",
      borderTop: "1px solid rgba(52,211,153,0.30)",
      borderRadius: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
      padding: "1.5rem",
    }}>
      <p style={{ color: "#6ee7b7", fontSize: 13, marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>{label}</p>
      <p style={{ color, fontSize: "2rem", fontWeight: 700, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
        {value}<span style={{ fontSize: "1rem", marginLeft: 4, color: "#6ee7b7" }}>{unit}</span>
      </p>
    </div>
  );
}

function ProgressBar({ value }) {
  const color = value >= 75 ? "#10b981" : value >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#6ee7b7", fontSize: 13 }}>Overall Progress</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{value}%</span>
      </div>
      <div style={{ background: "rgba(16,185,129,0.10)", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${value}%`, height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          boxShadow: `0 0 12px ${color}66`,
          transition: "width 0.8s ease",
        }} />
      </div>
    </div>
  );
}

export default function StudentDashboard({ theme }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/student/dashboard")
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid rgba(52,211,153,0.2)", borderTopColor: "#10b981",
          borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#6ee7b7", fontSize: 14 }}>Loading your dashboard…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: "2rem" }}>
      <div style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)",
        borderRadius: 12, padding: "1rem 1.5rem", color: "#f87171" }}>
        ⚠️ {error}
      </div>
    </div>
  );

  if (!data) return null;

  const { student, grades, summary, risk } = data;
  const riskStyle = risk ? (RISK_STYLE[risk.risk_level] || RISK_STYLE.safe) : null;

  // Latest grade per subject
  const subjectMap = {};
  for (const g of grades) {
    if (!subjectMap[g.subject] || g.id > subjectMap[g.subject].id) subjectMap[g.subject] = g;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>
          Welcome back, {student?.full_name?.split(" ")[0] || "Student"} 👋
        </h1>
        <p style={{ color: "#34786a", fontSize: 13, marginTop: 4 }}>
          Roll No: {student?.roll_no} &nbsp;·&nbsp; Class: {student?.class} – {student?.section}
        </p>
      </div>

      {/* Notifications */}
      {summary.notifications.length > 0 && (
        <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
          {summary.notifications.map((msg, i) => (
            <div key={i} style={{
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 10, padding: "0.75rem 1rem", color: "#fbbf24", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span> {msg}
            </div>
          ))}
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Average Marks"         value={summary.avgMarks}      unit="%" />
        <StatCard label="Attendance"            value={summary.attendancePct} unit="%" color={summary.attendancePct < 75 ? "#fbbf24" : "#34d399"} />
        <StatCard label="Assignment Completion" value={summary.assignmentPct} unit="%" />
        {riskStyle && (
          <div style={{
            background: riskStyle.bg, border: `1px solid ${riskStyle.border}`,
            borderRadius: 16, padding: "1.5rem",
          }}>
            <p style={{ color: "#6ee7b7", fontSize: 13, marginBottom: 8 }}>Risk Level</p>
            <p style={{ color: riskStyle.color, fontSize: "1.6rem", fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
              {riskStyle.label}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{
        background: "rgba(5,30,15,0.50)", backdropFilter: "blur(18px)",
        border: "1px solid rgba(52,211,153,0.18)", borderRadius: 16,
        padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <ProgressBar value={summary.progress} />
        <p style={{ color: "#34786a", fontSize: 12, marginTop: 8 }}>
          Progress = (Marks × 50%) + (Attendance × 30%) + (Assignments × 20%)
        </p>
      </div>

      {/* Subject Grades */}
      <div style={{
        background: "rgba(5,30,15,0.50)", backdropFilter: "blur(18px)",
        border: "1px solid rgba(52,211,153,0.18)", borderRadius: 16, padding: "1.5rem",
      }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Subject Scores
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(SUBJECTS).map(([key, label]) => {
            const g = subjectMap[key];
            const score = g ? Number(g.score) : null;
            const barColor = score === null ? "#34786a" : score < 35 ? "#f87171" : score < 60 ? "#fbbf24" : "#10b981";
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: "#6ee7b7", fontSize: 13 }}>{label}</span>
                  <span style={{ color: barColor, fontWeight: 700, fontSize: 13 }}>
                    {score !== null ? `${score}%` : "—"}
                    {score !== null && score < 35 && <span style={{ color: "#f87171", marginLeft: 6, fontSize: 11 }}>⚠ Below Pass</span>}
                  </span>
                </div>
                <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: 99, height: 7 }}>
                  <div style={{
                    width: score !== null ? `${score}%` : "0%", height: "100%", borderRadius: 99,
                    background: barColor, transition: "width 0.8s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}