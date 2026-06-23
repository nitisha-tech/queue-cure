
// src/components/QueueRequestCard.jsx
export default function QueueRequestCard({ patient, onAccept, onReject }) {
  return (
    <div style={styles.card}>
      <div style={styles.avatar}>
        {patient.name?.charAt(0).toUpperCase()}
      </div>
      <div style={styles.info}>
        <p style={styles.name}>{patient.name}</p>
        <p style={styles.reason}>{patient.reason || "No reason provided"}</p>
        <p style={styles.time}>
          {new Date(patient.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div style={styles.actions}>
        <button style={styles.acceptBtn} onClick={onAccept}>Accept</button>
        <button style={styles.rejectBtn} onClick={onReject}>Reject</button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    background: "#fafafa", border: "1px solid #eee",
    borderRadius: "10px", padding: "0.9rem 1rem",
  },
  avatar: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "#e0e7ff", color: "#4f46e5", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: "1rem", flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  name: { margin: 0, fontWeight: 600, color: "#1a1a2e", fontSize: "0.9rem" },
  reason: {
    margin: "0.15rem 0 0.2rem", color: "#666", fontSize: "0.8rem",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  time: { margin: 0, color: "#aaa", fontSize: "0.75rem" },
  actions: { display: "flex", flexDirection: "column", gap: "0.4rem", flexShrink: 0 },
  acceptBtn: {
    background: "#22c55e", color: "#fff", border: "none",
    borderRadius: "6px", padding: "0.4rem 0.85rem",
    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
  },
  rejectBtn: {
    background: "#fff", color: "#e53e3e", border: "1px solid #e53e3e",
    borderRadius: "6px", padding: "0.4rem 0.85rem",
    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
  },
};