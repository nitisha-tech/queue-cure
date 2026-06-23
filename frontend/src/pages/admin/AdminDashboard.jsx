// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import {
  getPendingReceptionists,
  approveReceptionist,
  rejectReceptionist,
  getQueueState,
  getAdminActivityLog,
} from "../../services/api";
import { useSocket } from "../../hooks/useSocket";

export default function AdminDashboard() {
  const [receptionists, setReceptionists] = useState([]);
  const [queueState, setQueueState] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [activeTab, setActiveTab] = useState("queue");

  const fetchAll = async () => {
    try {
      setLoading(true);
    
    // Fetch each independently so one failure doesn't break everything
      const pendingRes = await getPendingReceptionists().catch(() => ({ data: [] }));
      const queueRes = await getQueueState().catch(() => ({ data: {} }));
      const logRes = await getAdminActivityLog().catch(() => ({ data: [] }));

      setReceptionists(pendingRes.data);
      setQueueState({
        currentToken: queueRes.data.currentToken,
        avgConsultTime: queueRes.data.avgConsultTime || 10,
        waitingPatients: queueRes.data.waitingPatients || [],
      });
      setActivityLog(logRes.data);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useSocket((data) => {
    setQueueState({
      currentToken: data.queueState?.currentToken,
      avgConsultTime: data.queueState?.avgConsultTime,
      waitingPatients: data.waitingPatients || [],
    });
    if (data.activityLog) setActivityLog(data.activityLog);
  });

  const handleApprove = async (id) => {
    try {
      await approveReceptionist(id);
      setActionMsg("Receptionist approved.");
      fetchAll();
    } catch { setActionMsg("Failed to approve."); }
  };

  const handleReject = async (id) => {
    try {
      await rejectReceptionist(id);
      setActionMsg("Receptionist rejected.");
      fetchAll();
    } catch { setActionMsg("Failed to reject."); }
  };

  const waitingPatients = queueState?.waitingPatients || [];
  const avgConsultTime = queueState?.avgConsultTime || 10;

  const tabs = [
    { id: "queue", label: "Live Queue" },
    { id: "approvals", label: `Approvals${receptionists.length > 0 ? ` (${receptionists.length})` : ""}` },
    { id: "activity", label: "Activity Log" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>Admin Dashboard</h2>

        {actionMsg && (
          <div style={styles.toast} onClick={() => setActionMsg("")}>
            {actionMsg} <span>✕</span>
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}

        {/* Stats bar always visible */}
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <p style={styles.statNum}>{queueState?.currentToken ?? "—"}</p>
            <p style={styles.statLabel}>Now serving</p>
          </div>
          <div style={styles.stat}>
            <p style={styles.statNum}>{waitingPatients.length}</p>
            <p style={styles.statLabel}>In queue</p>
          </div>
          <div style={styles.stat}>
            <p style={styles.statNum}>{avgConsultTime} min</p>
            <p style={styles.statLabel}>Avg consult time</p>
          </div>
          <div style={styles.stat}>
            <p style={styles.statNum}>{waitingPatients.length * avgConsultTime} min</p>
            <p style={styles.statLabel}>Est. total wait</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabRow}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Live Queue */}
        {activeTab === "queue" && (
          <div style={styles.panel}>
            <p style={styles.panelTitle}>All patients currently waiting</p>
            {waitingPatients.length === 0 ? (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>Queue is empty right now.</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Token</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Position</th>
                    <th style={styles.th}>Est. wait</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {waitingPatients.map((p, i) => (
                    <tr key={p._id} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>
                        <span style={styles.tokenBadge}>#{p.tokenNumber}</span>
                      </td>
                      <td style={styles.td}>{p.name}</td>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>~{(i + 1) * avgConsultTime} min</td>
                      <td style={styles.td}>
                        <span style={styles.waitingBadge}>Waiting</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Approvals */}
        {activeTab === "approvals" && (
          <div style={styles.panel}>
            <p style={styles.panelTitle}>Pending receptionist approvals</p>
            {loading ? (
              <p style={styles.empty}>Loading...</p>
            ) : receptionists.length === 0 ? (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>✅ No pending approvals right now.</p>
                <p style={styles.emptySub}>New receptionist registrations will appear here.</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {receptionists.map((r) => (
                  <div key={r._id} style={styles.card}>
                    <div style={styles.avatar}>{r.name?.charAt(0).toUpperCase()}</div>
                    <div style={styles.info}>
                      <p style={styles.name}>{r.name}</p>
                      <p style={styles.email}>{r.email}</p>
                      <p style={styles.tag}>Pending approval</p>
                    </div>
                    <div style={styles.actions}>
                      <button style={styles.approveBtn} onClick={() => handleApprove(r._id)}>Approve</button>
                      <button style={styles.rejectBtn} onClick={() => handleReject(r._id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Activity Log */}
        {activeTab === "activity" && (
          <div style={styles.panel}>
            <p style={styles.panelTitle}>Receptionist actions log</p>
            {activityLog.length === 0 ? (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>No activity recorded yet.</p>
              </div>
            ) : (
              <div style={styles.logList}>
                {activityLog.map((log) => (
                  <div key={log._id} style={styles.logRow}>
                    <div style={{
                      ...styles.logDot,
                      background: log.action === "accepted" ? "#22c55e"
                        : log.action === "rejected" ? "#e53e3e"
                        : log.action === "called_next" ? "#4f46e5"
                        : "#f59e0b"
                    }} />
                    <div style={styles.logContent}>
                      <p style={styles.logText}>
                        <strong>{log.receptionistName}</strong>
                        {" "}{log.action === "accepted" && "accepted patient"}
                        {log.action === "rejected" && "rejected patient"}
                        {log.action === "called_next" && "called next token"}
                        {log.action === "set_avg_time" && "updated avg consult time"}
                        {log.patientName && <> — <span style={styles.logPatient}>{log.patientName}</span></>}
                        {log.tokenNumber && <> (Token #{log.tokenNumber})</>}
                        {log.value && <> → {log.value} min</>}
                      </p>
                      <p style={styles.logTime}>
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f5f5f5", padding: "2rem 1rem" },
  container: { maxWidth: "900px", margin: "0 auto" },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "#1a1a2e", margin: "0 0 1.5rem" },
  toast: {
    background: "#f0fff4", border: "1px solid #b2f5c8", color: "#1a7a3c",
    borderRadius: "8px", padding: "0.65rem 1rem", marginBottom: "1.25rem",
    fontSize: "0.875rem", display: "flex", justifyContent: "space-between", cursor: "pointer",
  },
  error: {
    background: "#fff0f0", border: "1px solid #ffcccc", color: "#c0392b",
    borderRadius: "8px", padding: "0.65rem 1rem", marginBottom: "1rem", fontSize: "0.875rem",
  },
  statsRow: {
    display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap",
  },
  stat: {
    flex: 1, minWidth: "120px", background: "#fff", borderRadius: "12px",
    padding: "1.25rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  statNum: { margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "#4f46e5" },
  statLabel: { margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#888" },
  tabRow: {
    display: "flex", gap: "0.5rem", marginBottom: "1.25rem",
    borderBottom: "2px solid #eee", paddingBottom: "0",
  },
  tab: {
    padding: "0.6rem 1.25rem", background: "transparent", border: "none",
    borderBottom: "2px solid transparent", marginBottom: "-2px",
    fontSize: "0.875rem", fontWeight: 600, color: "#888", cursor: "pointer",
  },
  tabActive: { color: "#4f46e5", borderBottomColor: "#4f46e5" },
  panel: {
    background: "#fff", borderRadius: "14px", padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  panelTitle: {
    margin: "0 0 1.25rem", fontSize: "0.8rem", fontWeight: 600,
    color: "#888", textTransform: "uppercase", letterSpacing: "0.5px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", padding: "0.6rem 0.75rem", fontSize: "0.78rem",
    fontWeight: 600, color: "#888", borderBottom: "2px solid #f0f0f0",
    textTransform: "uppercase", letterSpacing: "0.4px",
  },
  td: { padding: "0.75rem", fontSize: "0.875rem", color: "#1a1a2e", borderBottom: "1px solid #f5f5f5" },
  trEven: { background: "#fafafa" },
  tokenBadge: { fontWeight: 700, color: "#4f46e5" },
  waitingBadge: {
    background: "#f0f0ff", color: "#4f46e5", borderRadius: "999px",
    fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px",
  },
  grid: { display: "flex", flexDirection: "column", gap: "1rem" },
  card: {
    background: "#fafafa", border: "1px solid #eee", borderRadius: "10px",
    padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem",
  },
  avatar: {
    width: "42px", height: "42px", borderRadius: "50%", background: "#4f46e5",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: "1rem", flexShrink: 0,
  },
  info: { flex: 1 },
  name: { margin: 0, fontWeight: 600, color: "#1a1a2e", fontSize: "0.9rem" },
  email: { margin: "0.1rem 0 0.25rem", color: "#666", fontSize: "0.8rem" },
  tag: {
    display: "inline-block", background: "#fffbea", color: "#7a5c00",
    border: "1px solid #f6d860", borderRadius: "999px",
    fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px",
  },
  actions: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  approveBtn: {
    background: "#22c55e", color: "#fff", border: "none",
    borderRadius: "6px", padding: "0.4rem 0.9rem", fontSize: "0.8rem",
    fontWeight: 600, cursor: "pointer",
  },
  rejectBtn: {
    background: "#fff", color: "#e53e3e", border: "1px solid #e53e3e",
    borderRadius: "6px", padding: "0.4rem 0.9rem", fontSize: "0.8rem",
    fontWeight: 600, cursor: "pointer",
  },
  emptyCard: {
    background: "#fafafa", borderRadius: "10px", padding: "2rem",
    textAlign: "center", border: "1px dashed #ddd",
  },
  emptyText: { margin: 0, fontWeight: 600, color: "#1a1a2e" },
  emptySub: { color: "#888", fontSize: "0.875rem", marginTop: "0.4rem" },
  empty: { color: "#888", textAlign: "center", padding: "2rem" },
  logList: { display: "flex", flexDirection: "column", gap: "0" },
  logRow: {
    display: "flex", gap: "1rem", alignItems: "flex-start",
    padding: "0.85rem 0", borderBottom: "1px solid #f5f5f5",
  },
  logDot: { width: "10px", height: "10px", borderRadius: "50%", marginTop: "4px", flexShrink: 0 },
  logContent: { flex: 1 },
  logText: { margin: 0, fontSize: "0.875rem", color: "#1a1a2e", lineHeight: 1.5 },
  logPatient: { color: "#4f46e5", fontWeight: 600 },
  logTime: { margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#aaa" },
};