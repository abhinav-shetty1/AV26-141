import { useEffect, useState } from "react";
import { apiFetch, apiUpload } from "../../lib/api";

const RISK_STYLE = {
  safe:     { bg: "rgba(16,185,129,0.12)", color: "#34d399",  border: "rgba(52,211,153,0.3)",  label: "Safe" },
  at_risk:  { bg: "rgba(251,191,36,0.12)", color: "#fbbf24",  border: "rgba(251,191,36,0.3)",  label: "At Risk" },
  critical: { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)", label: "Critical" },
};

function RiskBadge({ level }) {
  const s = RISK_STYLE[level] || RISK_STYLE.safe;
  return (
    <span style={{
      padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

export default function TeacherDashboard({ theme }) {
  const [stats, setStats]         = useState(null);
  const [atRisk, setAtRisk]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const glass = {
    background: "rgba(5, 30, 15, 0.50)", backdropFilter: "blur(18px) saturate(180%)",
    border: "1px solid rgba(52, 211, 153, 0.18)", borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  };

  const statCards = stats ? [
    { label: "Total Students", value: stats.totalStudents, icon: "👥", color: "#34d399" },
    { label: "At Risk", value: stats.atRiskCount || 0, icon: "⚠️", color: "#fbbf24" },
    { label: "Critical", value: stats.criticalCount || 0, icon: "🚨", color: "#f87171" },
    { label: "Avg Attendance", value: stats.avgAttendance ? `${Number(stats.avgAttendance).toFixed(1)}%` : "0%", icon: "📅", color: "#60a5fa" },
  ] : [];

  const loadData = () => {
    Promise.all([
      apiFetch("/api/teacher/dashboard"),
      apiFetch("/api/teacher/students/at-risk"),
    ])
      .then(([s, ar]) => { setStats(s); setAtRisk(ar); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg("Uploading & parsing Excel...");
    try {
      const res = await apiUpload("/api/import/excel", file);
      setUploadMsg(`Success! Imported ${res.imported} students.`);
      loadData(); // refresh dashboard
    } catch (err) {
      setUploadMsg(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 960, margin: "0 auto", fontFamily: "'Inter',sans-serif" }}>
      {/* ── HEADER (ALWAYS VISIBLE) ──────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>
          Teacher Dashboard
        </h1>
        
        {/* Import Section */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {uploadMsg && (
            <span style={{ fontSize: 12, color: uploadMsg.includes("Error") ? "#f87171" : "#34d399", fontWeight: 500 }}>
              {uploadMsg}
            </span>
          )}
          <label style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#10b981,#059669)", color: "#ecfdf5",
            opacity: uploading ? 0.7 : 1, transition: "all 0.2s", display: "inline-block"
          }}>
            {uploading ? "Importing..." : "📥 Import Students (.xlsx)"}
            <input type="file" accept=".xlsx" onChange={handleFileUpload} disabled={uploading} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* ── CONDITIONAL CONTENT (LOADING / ERROR / DATA) ──────── */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", ...glass }}>
          <p style={{ color: "#6ee7b7" }}>Loading dashboard data…</p>
        </div>
      ) : error ? (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 12, padding: "1rem", color: "#f87171" }}>
            ⚠️ {error === "Invalid or expired token" ? "Session expired. Please log out and log in again." : error}
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {statCards.map(c => (
              <div key={c.label} style={{ ...glass, padding: "1.5rem" }}>
                <p style={{ color: "#6ee7b7", fontSize: 13, marginBottom: 8 }}>{c.label}</p>
                <p style={{ color: c.color, fontSize: "2.5rem", fontWeight: 800, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          {/* At-Risk Students */}
          <div style={{ ...glass, padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              ⚠️ Students Needing Attention
            </h2>
            {atRisk.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <p style={{ fontSize: "2rem", marginBottom: 8 }}>🎉</p>
                <p style={{ color: "#34d399", fontWeight: 600 }}>All students are on track!</p>
                <p style={{ color: "#34786a", fontSize: 13, marginTop: 4 }}>No at-risk or critical students.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Student", "Roll No", "Risk", "Score", "Attendance", "Avg Grade", "Assignment"].map(h => (
                        <th key={h} style={{ color: "#34786a", fontWeight: 600, textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(52,211,153,0.12)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {atRisk.map((r, i) => {
                      const s = r.students;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(52,211,153,0.06)", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "10px 12px" }}>
                            <p style={{ color: "#ecfdf5", fontWeight: 600 }}>{s?.users?.full_name || "—"}</p>
                            <p style={{ color: "#34786a", fontSize: 11 }}>{s?.users?.email}</p>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#6ee7b7" }}>{s?.roll_no || "—"}</td>
                          <td style={{ padding: "10px 12px" }}><RiskBadge level={r.risk_level} /></td>
                          <td style={{ padding: "10px 12px", color: "#fbbf24", fontWeight: 700 }}>{r.score}</td>
                          <td style={{ padding: "10px 12px", color: Number(r.attendance_score) < 75 ? "#f87171" : "#34d399" }}>
                            {Number(r.attendance_score).toFixed(1)}%
                          </td>
                          <td style={{ padding: "10px 12px", color: Number(r.grade_score) < 35 ? "#f87171" : "#34d399" }}>
                            {Number(r.grade_score).toFixed(1)}%
                          </td>
                          <td style={{ padding: "10px 12px", color: "#6ee7b7" }}>
                            {Number(r.assignment_score).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}