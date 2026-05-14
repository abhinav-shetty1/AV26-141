import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const RISK_STYLE = {
  at_risk:  { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "rgba(251,191,36,0.3)",  label: "At Risk" },
  critical: { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)", label: "Critical" },
};

export default function Alerts({ theme }) {
  const [alerts, setAlerts]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showAll, setShowAll]         = useState(false);
  const [reviewing, setReviewing]     = useState(null); // alert id
  const [note, setNote]               = useState("");
  const [followUp, setFollowUp]       = useState("");
  const [saving, setSaving]           = useState(false);

  const fetchAlerts = () => {
    setLoading(true);
    const endpoint = showAll ? "/api/alerts" : "/api/alerts/unreviewed";
    apiFetch(endpoint)
      .then(setAlerts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, [showAll]);

  const handleReview = async (id) => {
    setSaving(true);
    try {
      await apiFetch(`/api/alerts/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ note, follow_up_date: followUp || null }),
      });
      setReviewing(null);
      setNote("");
      setFollowUp("");
      fetchAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const glass = {
    background: "rgba(5,30,15,0.50)", backdropFilter: "blur(18px) saturate(180%)",
    border: "1px solid rgba(52,211,153,0.18)", borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", color: "#ecfdf5", fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>
          Alerts
        </h1>
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: showAll ? "rgba(52,211,153,0.12)" : "linear-gradient(135deg,#10b981,#059669)",
            border: showAll ? "1px solid rgba(52,211,153,0.3)" : "1px solid #10b981",
            color: showAll ? "#34d399" : "#ecfdf5",
          }}
        >
          {showAll ? "Show Unreviewed Only" : "Show All Alerts"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 12, padding: "1rem", color: "#f87171", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#6ee7b7", textAlign: "center", padding: "3rem" }}>Loading alerts…</p>
      ) : alerts.length === 0 ? (
        <div style={{ ...glass, padding: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: 8 }}>✅</p>
          <p style={{ color: "#34d399", fontWeight: 600, fontSize: "1rem" }}>No unreviewed alerts!</p>
          <p style={{ color: "#34786a", fontSize: 13, marginTop: 4 }}>All students are being monitored.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {alerts.map(alert => {
            const s  = RISK_STYLE[alert.risk_level] || RISK_STYLE.at_risk;
            const st = alert.students;
            const isReviewing = reviewing === alert.id;

            return (
              <div key={alert.id} style={{
                ...glass,
                borderLeft: `3px solid ${s.color}`,
                padding: "1.25rem 1.5rem",
                opacity: alert.reviewed ? 0.6 : 1,
              }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                      {alert.reviewed && (
                        <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>✓ Reviewed</span>
                      )}
                    </div>
                    <p style={{ color: "#ecfdf5", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>
                      {st?.users?.full_name || "Unknown Student"}
                    </p>
                    <p style={{ color: "#34786a", fontSize: 12, margin: 0 }}>
                      {st?.users?.email} &nbsp;·&nbsp; Roll: {st?.roll_no}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ color: "#34786a", fontSize: 11, margin: "0 0 8px" }}>
                      {new Date(alert.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {!alert.reviewed && (
                      <button
                        onClick={() => { setReviewing(isReviewing ? null : alert.id); setNote(""); setFollowUp(""); }}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: isReviewing ? "rgba(52,211,153,0.08)" : "linear-gradient(135deg,#10b981,#059669)",
                          border: isReviewing ? "1px solid rgba(52,211,153,0.25)" : "1px solid #10b981",
                          color: isReviewing ? "#34d399" : "#ecfdf5",
                        }}
                      >
                        {isReviewing ? "Cancel" : "Mark Reviewed"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Alert message */}
                <p style={{ color: "#6ee7b7", fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
                  {alert.message}
                </p>

                {/* Existing note */}
                {alert.reviewed && alert.note && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(16,185,129,0.06)", borderRadius: 8, borderLeft: "2px solid rgba(52,211,153,0.3)" }}>
                    <p style={{ color: "#34786a", fontSize: 11, margin: "0 0 4px" }}>Teacher note:</p>
                    <p style={{ color: "#6ee7b7", fontSize: 13, margin: 0 }}>{alert.note}</p>
                    {alert.follow_up_date && (
                      <p style={{ color: "#34786a", fontSize: 11, marginTop: 4 }}>Follow-up: {alert.follow_up_date}</p>
                    )}
                  </div>
                )}

                {/* Review form */}
                {isReviewing && (
                  <div style={{ marginTop: 12, padding: "1rem", background: "rgba(16,185,129,0.06)", borderRadius: 10, border: "1px solid rgba(52,211,153,0.15)" }}>
                    <label style={{ color: "#6ee7b7", fontSize: 12, display: "block", marginBottom: 6 }}>
                      Note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={2}
                      placeholder="Add a note about actions taken…"
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13,
                        background: "rgba(5,30,15,0.65)", border: "1px solid rgba(52,211,153,0.18)",
                        color: "#ecfdf5", outline: "none", resize: "vertical", boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 12, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div>
                        <label style={{ color: "#6ee7b7", fontSize: 12, display: "block", marginBottom: 4 }}>Follow-up date</label>
                        <input
                          type="date"
                          value={followUp}
                          onChange={e => setFollowUp(e.target.value)}
                          style={{
                            padding: "6px 10px", borderRadius: 8, fontSize: 13,
                            background: "rgba(5,30,15,0.65)", border: "1px solid rgba(52,211,153,0.18)",
                            color: "#ecfdf5", outline: "none",
                          }}
                        />
                      </div>
                      <button
                        onClick={() => handleReview(alert.id)}
                        disabled={saving}
                        style={{
                          marginTop: 20, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: saving ? "not-allowed" : "pointer",
                          background: saving ? "#065f46" : "linear-gradient(135deg,#10b981,#059669)",
                          border: "1px solid #10b981", color: "#ecfdf5",
                          boxShadow: saving ? "none" : "0 0 16px rgba(16,185,129,0.3)",
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        {saving ? "Saving…" : "Confirm Review"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}