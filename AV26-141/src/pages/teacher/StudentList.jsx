import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const RISK_STYLE = {
  safe:     { bg: "rgba(16,185,129,0.12)", color: "#34d399",  border: "rgba(52,211,153,0.3)",  label: "Safe" },
  at_risk:  { bg: "rgba(251,191,36,0.12)", color: "#fbbf24",  border: "rgba(251,191,36,0.3)",  label: "At Risk" },
  critical: { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)", label: "Critical" },
};

function RiskBadge({ level }) {
  const s = RISK_STYLE[level] || { bg: "rgba(52,211,153,0.08)", color: "#34786a", border: "rgba(52,211,153,0.2)", label: "No Data" };
  return (
    <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

export default function StudentList({ theme }) {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [filterRisk, setFilterRisk] = useState("all");

  useEffect(() => {
    apiFetch("/api/teacher/students")
      .then(setStudents)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <p style={{ color: "#6ee7b7" }}>Loading students…</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: "2rem" }}>
      <div style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 12, padding: "1rem", color: "#f87171" }}>
        {error}
      </div>
    </div>
  );

  const glass = {
    background: "rgba(5,30,15,0.50)", backdropFilter: "blur(18px) saturate(180%)",
    border: "1px solid rgba(52,211,153,0.18)", borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.roll_no?.toLowerCase().includes(q);
    const matchRisk = filterRisk === "all" || s.risk?.risk_level === filterRisk;
    return matchSearch && matchRisk;
  });

  const counts = {
    total:    students.length,
    safe:     students.filter(s => s.risk?.risk_level === "safe").length,
    at_risk:  students.filter(s => s.risk?.risk_level === "at_risk").length,
    critical: students.filter(s => s.risk?.risk_level === "critical").length,
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto", fontFamily: "'Inter',sans-serif" }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Student List
      </h1>

      {/* Quick stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: `${counts.total} Total`,    color: "#34d399", filter: "all" },
          { label: `${counts.safe} Safe`,       color: "#34d399", filter: "safe" },
          { label: `${counts.at_risk} At Risk`, color: "#fbbf24", filter: "at_risk" },
          { label: `${counts.critical} Critical`,color: "#f87171",filter: "critical" },
        ].map(c => (
          <button
            key={c.filter}
            onClick={() => setFilterRisk(c.filter)}
            style={{
              padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
              background: filterRisk === c.filter ? `${c.color}22` : "rgba(16,185,129,0.06)",
              border: filterRisk === c.filter ? `1px solid ${c.color}55` : "1px solid rgba(52,211,153,0.15)",
              color: filterRisk === c.filter ? c.color : "#6ee7b7",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search by name, email or roll no…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 380, padding: "10px 16px", borderRadius: 12,
            background: "rgba(5,30,15,0.65)", border: "1px solid rgba(52,211,153,0.18)",
            color: "#ecfdf5", fontSize: 13, outline: "none",
          }}
          onFocus={e => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.15)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(52,211,153,0.18)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Table */}
      <div style={{ ...glass, padding: "1.5rem" }}>
        {filtered.length === 0 ? (
          <p style={{ color: "#34786a", fontSize: 13, textAlign: "center", padding: "2rem 0" }}>
            No students found.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Name", "Roll No", "Class", "Risk Level", "Score", "Attendance", "Avg Grade"].map(h => (
                    <th key={h} style={{ color: "#34786a", fontWeight: 600, textAlign: "left",
                      padding: "8px 12px", borderBottom: "1px solid rgba(52,211,153,0.12)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const risk = s.risk;
                  const attColor = risk?.attendance_score < 75 ? "#f87171" : "#34d399";
                  const gradeColor = risk?.grade_score < 35 ? "#f87171" : "#34d399";
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(52,211,153,0.06)", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 12px" }}>
                        <p style={{ color: "#ecfdf5", fontWeight: 600, margin: 0 }}>{s.full_name}</p>
                        <p style={{ color: "#34786a", fontSize: 11, margin: 0 }}>{s.email}</p>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#6ee7b7" }}>{s.roll_no}</td>
                      <td style={{ padding: "10px 12px", color: "#6ee7b7" }}>{s.class} – {s.section}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <RiskBadge level={risk?.risk_level} />
                      </td>
                      <td style={{ padding: "10px 12px", color: "#ecfdf5", fontWeight: 600 }}>
                        {risk ? risk.score : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: attColor, fontWeight: 600 }}>
                        {risk ? `${Number(risk.attendance_score).toFixed(1)}%` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: gradeColor, fontWeight: 600 }}>
                        {risk ? `${Number(risk.grade_score).toFixed(1)}%` : "—"}
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