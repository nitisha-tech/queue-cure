
// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await registerUser(form);
      if (form.role === "receptionist") {
        setSuccess("Account created! Wait for admin approval before logging in.");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create account</h2>
        <p style={styles.sub}>Join Queue Cure</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Role</label>
          <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
            <option value="patient">Patient</option>
            <option value="receptionist">Receptionist</option>
          </select>

          {form.role === "receptionist" && (
            <div style={styles.notice}>
              ⚠️ Receptionist accounts need admin approval before you can log in.
            </div>
          )}

          <label style={styles.label}>Full name</label>
          <input
            name="name" type="text" placeholder="Your full name"
            value={form.name} onChange={handleChange}
            required style={styles.input}
          />

          <label style={styles.label}>Email</label>
          <input
            name="email" type="email" placeholder="you@example.com"
            value={form.email} onChange={handleChange}
            required style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            name="password" type="password" placeholder="Min. 6 characters"
            value={form.password} onChange={handleChange}
            required minLength={6} style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#f5f5f5",
  },
  card: {
    background: "#fff", borderRadius: "12px", padding: "2.5rem",
    width: "100%", maxWidth: "420px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: { margin: 0, fontSize: "1.6rem", fontWeight: 700, color: "#1a1a2e" },
  sub: { margin: "0.25rem 0 1.5rem", color: "#666", fontSize: "0.9rem" },
  error: {
    background: "#fff0f0", border: "1px solid #ffcccc", color: "#c0392b",
    borderRadius: "8px", padding: "0.6rem 1rem", marginBottom: "1rem", fontSize: "0.875rem",
  },
  success: {
    background: "#f0fff4", border: "1px solid #b2f5c8", color: "#1a7a3c",
    borderRadius: "8px", padding: "0.6rem 1rem", marginBottom: "1rem", fontSize: "0.875rem",
  },
  notice: {
    background: "#fffbea", border: "1px solid #f6d860", color: "#7a5c00",
    borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.82rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#444", marginTop: "0.5rem" },
  input: {
    padding: "0.65rem 0.9rem", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "0.95rem", outline: "none",
    background: "#fafafa",
  },
  btn: {
    marginTop: "1.25rem", padding: "0.75rem", background: "#4f46e5",
    color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem",
    fontWeight: 600, cursor: "pointer",
  },
  footer: { textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#666" },
  link: { color: "#4f46e5", fontWeight: 600, textDecoration: "none" },
};