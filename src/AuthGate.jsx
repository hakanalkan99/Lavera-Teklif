import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./core/supabaseClient";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data?.session || null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess || null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (mode === "password") return password.length >= 6;
    return true;
  }, [email, password, mode]);

  async function signInWithPassword() {
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setMsg({
          type: "error",
          text:
            error.message === "Invalid login credentials"
              ? "Email/şifre hatalı ya da bu kullanıcıda şifre hiç set edilmemiş olabilir. Supabase’den 'Reset password' ile yeni şifre belirle."
              : error.message,
        });
        return;
      }
    } catch {
      setMsg({ type: "error", text: "Bağlantı hatası. Supabase URL/Key doğru mu?" });
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        setMsg({ type: "error", text: error.message });
        return;
      }
      setMsg({ type: "ok", text: "Magic link gönderildi. Mailden linke tıkla ✅" });
    } catch {
      setMsg({ type: "error", text: "Bağlantı hatası. Supabase URL/Key doğru mu?" });
    } finally {
      setBusy(false);
    }
  }

  async function signUp() {
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        setMsg({ type: "error", text: error.message });
        return;
      }
      setMsg({
        type: "ok",
        text: "Kayıt başarılı ✅ (Mail doğrulama açıksa mailine doğrulama gelir.)",
      });
    } catch {
      setMsg({ type: "error", text: "Bağlantı hatası. Supabase URL/Key doğru mu?" });
    } finally {
      setBusy(false);
    }
  }

  // ✅ Login olduysa: SADECE app’i göster (sağ alttaki çıkış butonu KALDIRILDI)
  if (session) {
    return <>{children}</>;
  }

  // Login değilse: Login UI
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 22,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          padding: 18,
          color: "#fff",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Lavera Teklif</div>
        <div style={{ opacity: 0.75, fontSize: 12, marginBottom: 14 }}>
          Email + şifre ya da magic link ile giriş.
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setMode("password")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: mode === "password" ? "#ffffff" : "rgba(255,255,255,0.06)",
              color: mode === "password" ? "#0b1220" : "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Email + Şifre
          </button>
          <button
            onClick={() => setMode("magic")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: mode === "magic" ? "#ffffff" : "rgba(255,255,255,0.06)",
              color: mode === "magic" ? "#0b1220" : "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Magic Link
          </button>
        </div>

        <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@mail.com"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.20)",
            color: "#fff",
            outline: "none",
            marginBottom: 10,
          }}
        />

        {mode === "password" && (
          <>
            <label style={{ display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Şifre</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              type="password"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.20)",
                color: "#fff",
                outline: "none",
                marginBottom: 12,
              }}
            />
          </>
        )}

        {msg.text && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 14,
              background: msg.type === "error" ? "rgba(255,80,80,0.18)" : "rgba(80,255,140,0.16)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            {msg.text}
          </div>
        )}

        {mode === "password" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <button
              disabled={!canSubmit || busy}
              onClick={signInWithPassword}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                border: 0,
                background: canSubmit ? "#ffffff" : "rgba(255,255,255,0.20)",
                color: "#0b1220",
                fontWeight: 900,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {busy ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
            <button
              disabled={!canSubmit || busy}
              onClick={signUp}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontWeight: 900,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {busy ? "..." : "Kayıt Ol"}
            </button>
          </div>
        ) : (
          <button
            disabled={!canSubmit || busy}
            onClick={sendMagicLink}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 14,
              border: 0,
              background: canSubmit ? "#ffffff" : "rgba(255,255,255,0.20)",
              color: "#0b1220",
              fontWeight: 900,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {busy ? "Gönderiliyor..." : "Magic Link Gönder"}
          </button>
        )}
      </div>
    </div>
  );
}