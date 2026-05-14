import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetch } from "../../lib/api";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const pct = payload[0]?.value;
  return (
    <div style={{ background: "rgba(5,30,15,0.95)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: "#6ee7b7", fontSize: 12, marginBottom: 4 }}>{label}</p>
      <p style={{ color: pct < 75 ? "#fbbf24" : "#34d399", fontWeight: 700, fontSize: 18 }}>{pct}%</p>
    </div>
  );
}

export default function MyAttendance({ theme }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/student/attendance")
      .then(setAttendance)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <p style={{ color: "#6ee7b7" }}>Loading attendance…</p>
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

  const latest = attendance.length ? attendance[attendance.length - 1] : null;
  const overallPct = attendance.length
    ? attendance.reduce((s, a) => s + Number(a.percentage), 0) / attendance.length
    : 0;
  const pctColor = overallPct < 75 ? "#fbbf24" : "#10b981";

  const chartData = attendance.map(a => ({
    month:   a.month,
    pct:     Number(a.percentage),
    present: a.present_days,
    total:   a.total_days,
  }));

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", fontFamily: "'Inter',sans-serif" }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        My Attendance
      </h1>

      {overallPct < 75 && (
        <div style={{
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 10, padding: "0.75rem 1rem", color: "#fbbf24", fontSize: 13,
          marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8,
        }}>
          ⚠️ Your attendance ({overallPct.toFixed(1)}%) is below the required 75%. Please speak to your teacher.
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ ...glass, padding: "1.5rem" }}>
          <p style={{ color: "#6ee7b7", fontSize: 13, marginBottom: 8 }}>Average Attendance</p>
          <p style={{ color: pctColor, fontSize: "2rem", fontWeight: 700, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
            {overallPct.toFixed(1)}<span style={{ fontSize: "1rem", color: "#6ee7b7", marginLeft: 4 }}>%</span>
          </p>
        </div>
        {latest && (
          <>
            <div style={{ ...glass, padding: "1.5rem" }}>
              <p style={{ color: "#6ee7b7", fontSize: 13, marginBottom: 8 }}>Days Present (Latest)</p>
              <p style={{ color: "#34d399", fontSize: "2rem", fontWeight: 700, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
                {latest.present_days}<span style={{ fontSize: "1rem", color: "#6ee7b7", marginLeft: 4 }}>/ {latest.total_days}</span>
              </p>
            </div>
            <div style={{ ...glass, padding: "1.5rem" }}>
              <p style={{ color: "#6ee7b7", fontSize: 13, marginBottom: 8 }}>Status</p>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "'Syne',sans-serif",
                color: Number(latest.percentage) >= 75 ? "#34d399" : "#fbbf24" }}>
                {Number(latest.percentage) >= 75 ? "On Track ✓" : "Below Minimum"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Area Chart */}
      {chartData.length > 0 && (
        <div style={{ ...glass, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Monthly Attendance Trend
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#6ee7b7", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#34786a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2}
                fill="url(#attGrad)" dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6, fill: "#34d399" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly breakdown table */}
      <div style={{ ...glass, padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Monthly Breakdown
        </h2>
        {attendance.length === 0 ? (
          <p style={{ color: "#34786a", fontSize: 13 }}>No attendance records found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Month", "Present", "Total Days", "Percentage", "Status"].map(h => (
                    <th key={h} style={{ color: "#34786a", fontWeight: 600, textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(52,211,153,0.12)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...attendance].reverse().map(a => {
                  const pct = Number(a.percentage);
                  const ok = pct >= 75;
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgba(52,211,153,0.06)" }}>
                      <td style={{ padding: "10px 12px", color: "#ecfdf5" }}>{a.month}</td>
                      <td style={{ padding: "10px 12px", color: "#34d399", fontWeight: 600 }}>{a.present_days}</td>
                      <td style={{ padding: "10px 12px", color: "#6ee7b7" }}>{a.total_days}</td>
                      <td style={{ padding: "10px 12px", color: ok ? "#34d399" : "#fbbf24", fontWeight: 700 }}>{pct.toFixed(1)}%</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: ok ? "rgba(16,185,129,0.12)" : "rgba(251,191,36,0.12)",
                          color: ok ? "#34d399" : "#fbbf24",
                          border: `1px solid ${ok ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)"}`,
                        }}>
                          {ok ? "Good" : "Low"}
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