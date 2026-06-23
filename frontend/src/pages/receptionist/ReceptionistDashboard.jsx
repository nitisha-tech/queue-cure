
// src/pages/receptionist/ReceptionistDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import {
  getPendingPatients,
  acceptPatient,
  rejectPatient,
  callNext,
  setAvgTime,
  getQueueState,
} from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import QueueRequestCard from "../../components/QueueRequestCard";

export default function ReceptionistDashboard() {
  const [pendingPatients, setPendingPatients] = useState([]);
  const [queueState, setQueueState] = useState(null);
  const [avgTimeInput, setAvgTimeInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [callLoading, setCallLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [pendingRes, stateRes] = await Promise.all([
        getPendingPatients(),
        getQueueState(),
      ]);
      setPendingPatients(pendingRes.data);
      setQueueState(stateRes.data);
    } catch {
      setError("Failed to load queue data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Live socket updates
  useSocket((data) => {
    setQueueState(data.queueState);
    setPendingPatients(data.pendingPatients);
  });

  const handleAccept = async (id) => {
    try {
      await acceptPatient(id);
      showMsg("Patient accepted and token assigned.");
    } catch {
      showMsg("Failed to accept patient.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectPatient(id);
      showMsg("Patient request rejected.");
    } catch {
      showMsg("Failed to reject patient.");
    }
  };

  const handleCallNext = async () => {
    setCallLoading(true);
    try {
      await callNext();
      showMsg("Next token called.");
    } catch {
      showMsg("Failed to call next. Queue may be empty.");
    } finally {
      setCallLoading(false);
    }
  };

  const handleSetAvgTime = async () => {
    if (!avgTimeInput || isNaN(avgTimeInput) || Number(avgTimeInput) <= 0) {
      showMsg("Enter a valid number of minutes.");
      return;
    }
    try {
      await setAvgTime(Number(avgTimeInput));
      showMsg(`Average consultation time set to ${avgTimeInput} min.`);
      setAvgTimeInput("");
    } catch {
      showMsg("Failed to update average time.");
    }
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div style={styles.centered}>Loading dashboard...</div>;

  const waitingPatients = queueState?.waitingPatients || [];
  const currentToken = queueState?.currentToken || null;
  const avgConsultTime = queueState?.avgConsultTime || 10;

  return (
    <div style={styles.page}>
      {msg && <div style={styles.toast}>{msg}</div>}

      <div style={styles.container}>
        <h2 style={styles.title}>Receptionist Dashboard</h2>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.grid}>

          {/* LEFT — Queue Manager */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Queue Manager</h3>

            {/* Current token */}
            <div style={styles.currentBox}>
              <p style={styles.currentLabel}>Now serving</p>
              <p style={styles.currentToken}>
                {currentToken ? `#${currentToken}` : "—"}
              </p>
            </div>

            {/* Stats row */}
            <div style={styles.statsRow}>
              <div style={styles.stat}>
                <p style={styles.statNum}>{waitingPatients.length}</p>
                <p style={styles.statLabel}>In queue</p>
              </div>
              <div style={styles.stat}>
                <p style={styles.statNum}>{avgConsultTime} min</p>
                <p style={styles.statLabel}>Avg. consult time</p>
              </div>
              <div style={styles.stat}>
                <p style={styles.statNum}>
                  {waitingPatients.length * avgConsultTime} min
                </p>
                <p style={styles.statLabel}>Est. total wait</p>
              </div>
            </div>

            {/* Call next button */}
            <button
              style={{
                ...styles.callBtn,
                opacity: callLoading || waitingPatients.length === 0 ? 0.5 : 1,
              }}
              onClick={handleCallNext}
              disabled={callLoading || waitingPatients.length === 0}
            >
              {callLoading ? "Calling..." : "⏭ Call Next Token"}
            </button>

            {/* Set avg time */}
            <div style={styles.avgBox}>
              <p style={styles.avgLabel}>Set average consultation time</p>
              <div style={styles.avgRow}>
                <input
                  type="number"
                  min="1"
                  placeholder={`Current: ${avgConsultTime} min`}
                  value={avgTimeInput}
                  onChange={(e) => setAvgTimeInput(e.target.value)}
                  style={styles.avgInput}
                />
                <button onClick={handleSetAvgTime} style={styles.avgBtn}>
                  Set
                </button>
              </div>
            </div>

            {/* Waiting list */}
            <div style={styles.waitingList}>
              <p style={styles.waitingTitle}>Accepted — waiting</p>
              {waitingPatients.length === 0 ? (
                <p style={styles.emptyNote}>No patients in queue yet.</p>
              ) : (
                waitingPatients.map((p, i) => (
                  <div key={p._id} style={styles.waitingRow}>
                    <span style={styles.waitingToken}>#{p.tokenNumber}</span>
                    <span style={styles.waitingName}>{p.name}</span>
                    <span style={styles.waitingEta}>
                      ~{(i + 1) * avgConsultTime} min
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — Pending Requests */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>
              Incoming Requests
              {pendingPatients.length > 0 && (
                <span style={styles.badge}>{pendingPatients.length}</span>
              )}
            </h3>

            {pendingPatients.length === 0 ? (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>No pending requests.</p>
                <p style={styles.emptySub}>
                  New patient requests will appear here in real time.
                </p>
              </div>
            ) : (
              <div style={styles.requestList}>
                {pendingPatients.map((p) => (
                  <QueueRequestCard
                    key={p._id}
                    patient={p}
                    onAccept={() => handleAccept(p._id)}
                    onReject={() => handleReject(p._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f5f5f5", padding: "2rem 1rem" },
  centered: { textAlign: "center", padding: "4rem", color: "#888" },
  container: { maxWidth: "1100px", margin: "0 auto" },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "#1a1a2e", marginBottom: "1.5rem" },
  error: {
    background: "#fff0f0", border: "1px solid #ffcccc", color: "#c0392b",
    borderRadius: "8px", padding: "0.65rem 1rem", marginBottom: "1rem", fontSize: "0.875rem",
  },
  toast: {
    position: "fixed", top: "70px", left: "50%", transform: "translateX(-50%)",
    background: "#1a1a2e", color: "#fff", padding: "0.65rem 1.5rem",
    borderRadius: "999px", fontSize: "0.875rem", zIndex: 999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem",
    "@media(max-width:700px)": { gridTemplateColumns: "1fr" },
  },
  panel: {
    background: "#fff", borderRadius: "14px", padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  panelTitle: {
    fontSize: "1rem", fontWeight: 700, color: "#1a1a2e",
    marginTop: 0, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem",
  },
  badge: {
    background: "#4f46e5", color: "#fff", borderRadius: "999px",
    fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px",
  },
  currentBox: {
    background: "#f0f0ff", borderRadius: "10px", padding: "1.25rem",
    textAlign: "center", marginBottom: "1rem",
  },
  currentLabel: { margin: 0, fontSize: "0.8rem", color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
  currentToken: { margin: "0.25rem 0 0", fontSize: "3rem", fontWeight: 800, color: "#4f46e5" },
  statsRow: { display: "flex", gap: "0.75rem", marginBottom: "1.25rem" },
  stat: {
    flex: 1, background: "#fafafa", border: "1px solid #eee",
    borderRadius: "8px", padding: "0.75rem", textAlign: "center",
  },
  statNum: { margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "#1a1a2e" },
  statLabel: { margin: "0.2rem 0 0", fontSize: "0.72rem", color: "#888" },
  callBtn: {
    width: "100%", padding: "0.85rem", background: "#4f46e5", color: "#fff",
    border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: 700,
    cursor: "pointer", marginBottom: "1.25rem", transition: "opacity 0.2s",
  },
  avgBox: {
    background: "#fafafa", border: "1px solid #eee",
    borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem",
  },
  avgLabel: { margin: "0 0 0.5rem", fontSize: "0.8rem", fontWeight: 600, color: "#444" },
  avgRow: { display: "flex", gap: "0.5rem" },
  avgInput: {
    flex: 1, padding: "0.55rem 0.75rem", borderRadius: "7px",
    border: "1px solid #ddd", fontSize: "0.9rem", outline: "none",
  },
  avgBtn: {
    padding: "0.55rem 1rem", background: "#1a1a2e", color: "#fff",
    border: "none", borderRadius: "7px", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem",
  },
  waitingList: { marginTop: "0.5rem" },
  waitingTitle: { fontSize: "0.8rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.75rem" },
  waitingRow: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.6rem 0", borderBottom: "1px solid #f0f0f0",
  },
  waitingToken: { fontWeight: 700, color: "#4f46e5", fontSize: "0.9rem", minWidth: "36px" },
  waitingName: { flex: 1, fontSize: "0.875rem", color: "#1a1a2e" },
  waitingEta: { fontSize: "0.8rem", color: "#888" },
  emptyCard: {
    background: "#fafafa", borderRadius: "10px", padding: "2.5rem 1.5rem",
    textAlign: "center", border: "1px dashed #ddd",
  },
  emptyText: { margin: 0, fontWeight: 600, color: "#1a1a2e", fontSize: "0.95rem" },
  emptySub: { margin: "0.4rem 0 0", color: "#888", fontSize: "0.82rem" },
  emptyNote: { color: "#aaa", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" },
  requestList: { display: "flex", flexDirection: "column", gap: "0.75rem" },
};