// src/pages/patient/PatientHome.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { joinQueue, getMyQueueStatus } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // On load check if patient already has active request
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await getMyQueueStatus();
        if (res.data && ["pending", "waiting", "serving"].includes(res.data.status)) {
          navigate("/patient/waiting");
        }
      } catch {
        // No active request — stay on this page
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await joinQueue({ name: user.name, reason });
      navigate("/patient/waiting");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join queue. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.centered}>Checking your status...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconBox}>🏥</div>
        <h2 style={styles.title}>Request a consultation</h2>
        <p style={styles.sub}>
          Hi <strong>{user?.name}</strong>, fill in your details and we'll add
          you to the queue.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Your name</label>
          <input
            type="text"
            value={user?.name || ""}
            disabled
            style={{ ...styles.input, ...styles.inputDisabled }}
          />

          <label style={styles.label}>Reason for visit</label>
          <textarea
            placeholder="e.g. fever, follow-up, general checkup..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            style={styles.textarea}
          />

          <button type="submit" disabled={submitting} style={styles.btn}>
            {submitting ? "Sending request..." : "Request to join queue"}
          </button>
        </form>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            📋 Your request will be reviewed by the receptionist. Once accepted,
            you'll receive a token number and can track your position live.
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
  card: {
    background: "#fff", borderRadius: "14px", padding: "2.5rem",
    width: "100%", maxWidth: "460px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  iconBox: { fontSize: "2.5rem", marginBottom: "0.75rem" },
  title: { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e" },
  sub: { margin: "0.4rem 0 1.5rem", color: "#666", fontSize: "0.9rem", lineHeight: 1.5 },
  error: {
    background: "#fff0f0", border: "1px solid #ffcccc", color: "#c0392b",
    borderRadius: "8px", padding: "0.65rem 1rem",
    marginBottom: "1rem", fontSize: "0.875rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#444", marginTop: "0.5rem" },
  input: {
    padding: "0.65rem 0.9rem", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "0.95rem", outline: "none",
  },
  inputDisabled: { background: "#f5f5f5", color: "#888", cursor: "not-allowed" },
  textarea: {
    padding: "0.65rem 0.9rem", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "0.9rem",
    outline: "none", resize: "vertical", fontFamily: "inherit",
  },
  btn: {
    marginTop: "1.25rem", padding: "0.8rem", background: "#4f46e5",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "1rem", fontWeight: 600, cursor: "pointer",
  },
  infoBox: {
    marginTop: "1.5rem", background: "#f0f0ff",
    borderRadius: "10px", padding: "1rem",
  },
  infoText: { margin: 0, fontSize: "0.82rem", color: "#4f46e5", lineHeight: 1.6 },
};