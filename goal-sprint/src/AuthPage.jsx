import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── Security constants ───────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;          // lock out after 5 failed attempts
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minute lockout window
const PASSWORD_MIN_LENGTH = 8;         // stronger than Supabase's 6-char default

// Password strength: must have uppercase, lowercase, number
function validatePassword(pw) {
  if (pw.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  return null;
}

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score, label: "Weak", color: "#f87171" };
  if (score <= 4) return { score, label: "Fair", color: "#facc15" };
  return { score, label: "Strong", color: "#34d399" };
}

// ─── Rate limiter (client-side, stored in sessionStorage) ─────────────────────
function getRateLimitState() {
  try {
    return JSON.parse(sessionStorage.getItem("gs:rateLimit") || "{}");
  } catch { return {}; }
}

function setRateLimitState(state) {
  try { sessionStorage.setItem("gs:rateLimit", JSON.stringify(state)); } catch {}
}

function checkRateLimit() {
  const state = getRateLimitState();
  const now = Date.now();
  if (state.lockedUntil && now < state.lockedUntil) {
    const secsLeft = Math.ceil((state.lockedUntil - now) / 1000);
    return { locked: true, secsLeft };
  }
  return { locked: false, attempts: state.attempts || 0 };
}

function recordFailedAttempt() {
  const state = getRateLimitState();
  const attempts = (state.attempts || 0) + 1;
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    setRateLimitState({ attempts, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
  } else {
    setRateLimitState({ attempts });
  }
}

function clearRateLimit() {
  try { sessionStorage.removeItem("gs:rateLimit"); } catch {}
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthPage({ dark, sessionExpired = false }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const bg = dark ? "#0f1117" : "#f0f2f7";
  const surface = dark ? "#1a1d27" : "#ffffff";
  const text = dark ? "#e2e8f0" : "#1e293b";
  const subtext = dark ? "#64748b" : "#94a3b8";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const strength = getPasswordStrength(password);

  // Countdown timer for lockout display
  useEffect(() => {
    const { locked, secsLeft } = checkRateLimit();
    if (locked) setLockoutSecs(secsLeft);
  }, []);

  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const timer = setInterval(() => {
      setLockoutSecs(s => {
        if (s <= 1) { clearInterval(timer); clearRateLimit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSecs]);

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  }

  // Clear sensitive state from memory on unmount
  useEffect(() => {
    return () => {
      setPassword("");
      setConfirmPassword("");
    };
  }, []);

  async function handleSubmit() {
    setError("");
    setSuccess("");

    // Client-side rate limit check
    const rl = checkRateLimit();
    if (rl.locked) {
      setError(`Too many failed attempts. Try again in ${rl.secsLeft} seconds.`);
      setLockoutSecs(rl.secsLeft);
      return;
    }

    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return; }

    if (mode === "reset") {
      await handlePasswordReset();
      return;
    }

    if (!password) { setError("Please enter your password."); return; }

    if (mode === "signup") {
      const pwError = validatePassword(password);
      if (pwError) { setError(pwError); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    }

    setLoading(true);

    if (mode === "signup") {
      await handleSignUp();
    } else {
      await handleLogin();
    }

    setLoading(false);
  }

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      recordFailedAttempt();
      const rl = checkRateLimit();
      if (rl.locked) {
        setError(`Too many failed attempts. Account locked for ${Math.ceil(LOCKOUT_DURATION_MS / 60000)} minutes.`);
        setLockoutSecs(Math.ceil(LOCKOUT_DURATION_MS / 1000));
      } else {
        const msg = error.message.toLowerCase();
        const attemptsLeft = MAX_LOGIN_ATTEMPTS - (rl.attempts || 0);
        if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("wrong")) {
          setError(`Incorrect email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before lockout.`);
        } else if (msg.includes("email not confirmed")) {
          setError("Please confirm your email address before logging in. Check your inbox.");
        } else {
          setError(error.message);
        }
      }
    } else {
      clearRateLimit(); // reset on successful login
      setPassword("");  // clear sensitive data from memory
    }
  }

  async function handleSignUp() {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (data?.user?.identities?.length === 0) {
      setError("An account with this email already exists. Please log in instead.");
      switchMode("login");
    } else {
      setPassword("");
      setConfirmPassword("");
      setSuccess("Account created! Check your email for a confirmation link before logging in.");
    }
  }

  async function handlePasswordReset() {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Always show success even if email not found — prevents user enumeration
      setSuccess("If an account exists for that email, a reset link has been sent. It expires in 1 hour.");
    }
  }

  const isLocked = lockoutSecs > 0;

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      <div style={{ width: 440, background: surface, borderRadius: 24, padding: 40, border: `1px solid ${border}`, boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.5)" : "0 8px 40px rgba(0,0,0,0.1)" }}>

        {/* Session expired notice */}
        {sessionExpired && (
          <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontSize: 13 }}>
            🔒 Your session has expired. Please log in again.
          </div>
        )}

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 32, background: "linear-gradient(135deg, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Goal Sprint
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: subtext }}>Your personal agile board</p>
        </div>

        {/* Tab Toggle — only show for login/signup, not reset */}
        {mode !== "reset" && (
          <div style={{ display: "flex", background: dark ? "rgba(255,255,255,0.04)" : "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                  background: mode === m ? (dark ? "#22263a" : "#ffffff") : "transparent",
                  color: mode === m ? text : subtext,
                  boxShadow: mode === m ? (dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.1)") : "none"
                }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
        )}

        {/* Reset mode header */}
        {mode === "reset" && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: text }}>Reset your password</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: subtext }}>We'll send a reset link to your email. It expires in 1 hour.</p>
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: subtext, display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              autoComplete="email"
              style={inputStyle(dark, text)} />
          </div>

          {mode !== "reset" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: subtext, display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  style={{ ...inputStyle(dark, text), paddingRight: 42 }} />
                <button onClick={() => setShowPassword(s => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: subtext, fontSize: 14, padding: 0 }}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>

              {/* Password strength meter — only on signup */}
              {mode === "signup" && password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : (dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"), transition: "background 0.2s" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Confirm password — signup only */}
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: subtext, display: "block", marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                autoComplete="new-password"
                style={{ ...inputStyle(dark, text), borderColor: confirmPassword && confirmPassword !== password ? "rgba(248,113,113,0.5)" : undefined }} />
              {confirmPassword && confirmPassword !== password && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>Passwords do not match</p>
              )}
            </div>
          )}
        </div>

        {/* Password requirements hint for signup */}
        {mode === "signup" && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${border}`, fontSize: 11, color: subtext, lineHeight: 1.7 }}>
            Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number.
          </div>
        )}

        {/* Lockout warning */}
        {isLocked && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontSize: 13 }}>
            🔒 Account temporarily locked. Try again in {lockoutSecs}s.
          </div>
        )}

        {/* Error */}
        {error && !isLocked && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: 13 }}>
            ✓ {success}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading || isLocked}
          style={{ marginTop: 22, width: "100%", padding: "12px", borderRadius: 12, border: "none", background: isLocked ? (dark ? "#2d3348" : "#e2e8f0") : "linear-gradient(135deg, #60a5fa, #34d399)", color: isLocked ? subtext : "#0f1117", fontWeight: 700, fontSize: 15, cursor: (loading || isLocked) ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, transition: "all 0.2s" }}>
          {loading ? "Please wait..." : mode === "login" ? "Log In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
        </button>

        {/* Footer links */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          {mode === "login" && (
            <>
              <p style={{ margin: 0, fontSize: 13, color: subtext }}>
                Don't have an account?{" "}
                <span onClick={() => switchMode("signup")} style={{ color: "#60a5fa", cursor: "pointer", fontWeight: 600 }}>Sign up</span>
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 13 }}>
                <span onClick={() => switchMode("reset")} style={{ color: subtext, cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Forgot your password?</span>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p style={{ margin: 0, fontSize: 13, color: subtext }}>
              Already have an account?{" "}
              <span onClick={() => switchMode("login")} style={{ color: "#60a5fa", cursor: "pointer", fontWeight: 600 }}>Log in</span>
            </p>
          )}
          {mode === "reset" && (
            <p style={{ margin: 0, fontSize: 13, color: subtext }}>
              <span onClick={() => switchMode("login")} style={{ color: "#60a5fa", cursor: "pointer", fontWeight: 600 }}>← Back to Log In</span>
            </p>
          )}
        </div>
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
