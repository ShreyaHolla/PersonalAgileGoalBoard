import { useState } from "react";
import { supabase } from "./supabase";

export default function AuthPage({ dark }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bg = dark ? "#0f1117" : "#f0f2f7";
  const surface = dark ? "#1a1d27" : "#ffffff";
  const text = dark ? "#e2e8f0" : "#1e293b";
  const subtext = dark ? "#64748b" : "#94a3b8";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  async function handleSubmit() {
    setError("");
    setSuccess("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Account created! Check your email to confirm, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      <div style={{ width: 420, background: surface, borderRadius: 24, padding: 40, border: `1px solid ${border}`, boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.5)" : "0 8px 40px rgba(0,0,0,0.1)" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 32, background: "linear-gradient(135deg, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Goal Sprint
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: subtext }}>Your personal agile board</p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: "flex", background: dark ? "rgba(255,255,255,0.04)" : "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                background: mode === m ? (dark ? "#22263a" : "#ffffff") : "transparent",
                color: mode === m ? text : subtext,
                boxShadow: mode === m ? (dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.1)") : "none"
              }}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: subtext, display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              style={inputStyle(dark, text)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: subtext, display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              style={inputStyle(dark, text)} />
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: 13 }}>
            {success}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ marginTop: 22, width: "100%", padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #60a5fa, #34d399)", color: "#0f1117", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}>
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: subtext }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
            style={{ color: "#60a5fa", cursor: "pointer", fontWeight: 600 }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}

function inputStyle(dark, text) {
  return {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}`,
    background: dark ? "rgba(255,255,255,0.05)" : "#f8f9fc",
    color: text, fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };
}
