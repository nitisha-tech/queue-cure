
// src/components/Navbar.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>Queue Cure</span>
      <div style={styles.right}>
        <span style={styles.badge}>{user.role.toUpperCase()}</span>
        <span style={styles.name}>{user.name}</span>
        <button onClick={handleLogout} style={styles.btn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.75rem 1.5rem", background: "#1a1a2e", color: "#fff",
    position: "sticky", top: 0, zIndex: 100,
  },
  brand: { fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.5px" },
  right: { display: "flex", alignItems: "center", gap: "1rem" },
  badge: {
    background: "#4f46e5", color: "#fff", fontSize: "0.7rem",
    padding: "2px 8px", borderRadius: "999px", fontWeight: 600,
  },
  name: { fontSize: "0.9rem", opacity: 0.85 },
  btn: {
    background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
    padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem",
  },
};