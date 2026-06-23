
// src/pages/patient/WaitingRoom.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyQueueStatus } from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import TokenCard from "../../components/TokenCard";

export default function WaitingRoom() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await getMyQueueStatus();
      setStatus(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        navigate("/patient");
      } else {
        setError("Failed to load your queue status.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  // Live socket updates — refresh my status on every queue change
  useSocket((data) => {
  // Check if patient moved from pending to waiting
    const myRecord = data.waitingPatients?.find(
      (p) => p._id === status?._id
    );

    if (myRecord) {
      setStatus((prev) => ({
        ...prev,
        status: "waiting",
        tokenNumber: myRecord.tokenNumber,
        tokensAhead: myRecord.tokensAhead,
        currentToken: data.queueState?.currentToken,
        avgConsultTime: data.queueState?.avgConsultTime,
      }));
      return;
    }

  // Check if this patient is now being served
    if (status?.tokenNumber && data.queueState?.currentToken === status.tokenNumber) {
      setStatus((prev) => ({
        ...prev,
        status: "serving",
        tokensAhead: 0,
        currentToken: data.queueState?.currentToken,
      }));
      return;
    }

  // Update queue position even if not found in waiting list
    if (status?.status === "waiting") {
      setStatus((prev) => ({
        ...prev,
        currentToken: data.queueState?.currentToken,
        avgConsultTime: data.queueState?.avgConsultTime,
        tokensAhead: data.waitingPatients?.findIndex(p => p._id === prev._id) ?? prev.tokensAhead,
      }));
    }
  });

  if (loading) return <div style={styles.centered}>Loading your status...</div>;
  if (error) return <div style={styles.centered}>{error}</div>;

  if (!status || status.status === "rejected") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.rejectedIcon}>❌</p>
          <h3 style={styles.rejectedTitle}>Request not accepted</h3>
          <p style={styles.rejectedSub}>
            Your queue request was rejected or not found. Please try again.
          </p>
          <button style={styles.btn} onClick={() => navigate("/patient")}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (status.status === "pending") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.pendingIcon}>⏳</p>
          <h3 style={styles.pendingTitle}>Waiting for approval</h3>
          <p style={styles.pendingSub}>
            The receptionist will accept your request shortly. This page will
            update automatically.
          </p>
          <div style={styles.pulse} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <h2 style={styles.heading}>Your queue status</h2>
        <p style={styles.headingSub}>This updates live — no need to refresh.</p>

        <TokenCard
          myToken={status.tokenNumber}
          currentToken={status.currentToken}
          tokensAhead={status.tokensAhead}
          avgConsultTime={status.avgConsultTime}
        />

        <div style={styles.tipBox}>
          <p style={styles.tipText}>
            💡 Stay nearby. You'll be called when your token is up.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#f5f5f5",
    display: "flex", alignItems: "center",
    justifyContent: "center", padding: "2rem 1rem",
  },
  centered: { textAlign: "center", padding: "4rem", color: "#888" },
  wrapper: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "1.25rem", width: "100%",
  },
  heading: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e" },
  headingSub: { margin: "0.25rem 0 0", color: "#888", fontSize: "0.875rem" },
  tipBox: {
    background: "#fff", borderRadius: "10px", padding: "1rem 1.25rem",
    maxWidth: "420px", width: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  tipText: { margin: 0, fontSize: "0.85rem", color: "#555", lineHeight: 1.6 },
  card: {
    background: "#fff", borderRadius: "14px", padding: "2.5rem",
    maxWidth: "400px", width: "100%", textAlign: "center",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  pendingIcon: { fontSize: "3rem", margin: "0 0 0.5rem" },
  pendingTitle: { margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: "1.2rem" },
  pendingSub: { color: "#666", fontSize: "0.875rem", lineHeight: 1.6, marginTop: "0.5rem" },
  pulse: {
    width: "12px", height: "12px", borderRadius: "50%",
    background: "#4f46e5", margin: "1.5rem auto 0",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  rejectedIcon: { fontSize: "3rem", margin: "0 0 0.5rem" },
  rejectedTitle: { margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: "1.2rem" },
  rejectedSub: { color: "#666", fontSize: "0.875rem", lineHeight: 1.6, marginTop: "0.5rem" },
  btn: {
    marginTop: "1.5rem", padding: "0.7rem 1.5rem", background: "#4f46e5",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
  },
};