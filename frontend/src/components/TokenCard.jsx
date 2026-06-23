
// src/components/TokenCard.jsx
export default function TokenCard({ myToken, currentToken, tokensAhead, avgConsultTime }) {
  const estimatedWait = tokensAhead * avgConsultTime;
  const isNext = tokensAhead === 1;
  const isServing = tokensAhead === 0;

  return (
    <div style={styles.card}>
      {/* My token */}
      <div style={styles.myTokenBox}>
        <p style={styles.myTokenLabel}>Your token number</p>
        <p style={styles.myTokenNum}>#{myToken}</p>
      </div>

      <div style={styles.divider} />

      {/* Status */}
      <div style={styles.statusBox}>
        {isServing ? (
          <div style={{ ...styles.statusPill, ...styles.pillGreen }}>
            🎉 You are being served now!
          </div>
        ) : isNext ? (
          <div style={{ ...styles.statusPill, ...styles.pillAmber }}>
            ⚡ You are next!
          </div>
        ) : (
          <div style={{ ...styles.statusPill, ...styles.pillBlue }}>
            Please wait
          </div>
        )}
      </div>

      <div style={styles.divider} />

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <p style={styles.statNum}>{isServing ? "—" : tokensAhead}</p>
          <p style={styles.statLabel}>Tokens ahead</p>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.stat}>
          <p style={styles.statNum}>#{currentToken || "—"}</p>
          <p style={styles.statLabel}>Now serving</p>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.stat}>
          <p style={styles.statNum}>
            {isServing ? "0" : `~${estimatedWait}`} min
          </p>
          <p style={styles.statLabel}>Est. wait</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff", borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "2rem", width: "100%", maxWidth: "420px",
  },
  myTokenBox: { textAlign: "center", padding: "0.5rem 0" },
  myTokenLabel: {
    margin: 0, fontSize: "0.78rem", fontWeight: 600,
    color: "#888", textTransform: "uppercase", letterSpacing: "0.5px",
  },
  myTokenNum: {
    margin: "0.25rem 0 0", fontSize: "4.5rem",
    fontWeight: 800, color: "#4f46e5", lineHeight: 1,
  },
  divider: { height: "1px", background: "#f0f0f0", margin: "1.25rem 0" },
  statusBox: { display: "flex", justifyContent: "center" },
  statusPill: {
    padding: "0.45rem 1.25rem", borderRadius: "999px",
    fontWeight: 600, fontSize: "0.875rem",
  },
  pillGreen: { background: "#f0fff4", color: "#1a7a3c", border: "1px solid #b2f5c8" },
  pillAmber: { background: "#fffbea", color: "#7a5c00", border: "1px solid #f6d860" },
  pillBlue: { background: "#f0f0ff", color: "#4f46e5", border: "1px solid #c7d2fe" },
  statsRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  stat: { flex: 1, textAlign: "center" },
  statNum: { margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#1a1a2e" },
  statLabel: { margin: "0.2rem 0 0", fontSize: "0.72rem", color: "#888" },
  statDivider: { width: "1px", height: "40px", background: "#f0f0f0" },
};