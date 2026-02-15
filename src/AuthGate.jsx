import React, { useEffect, useState } from "react";
import { supabase } from "./core/supabaseClient";
import { Button, Card, Input } from "./ui/ui";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function doLogin() {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setMsg(error.message);
  }

  async function doSignup() {
    setMsg("");
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) setMsg(error.message);
    else setMsg("Kayıt alındı. Mail doğrulaması kapalıysa direkt giriş olur; açıksa mailini doğrula.");
  }

  async function doLogout() {
    await supabase.auth.signOut();
  }

  if (session) {
    return (
      <div>
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50 truncate">Giriş: {session.user.email}</div>
            <Button variant="ghost" onClick={doLogout}>
              Çıkış
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-2xl font-black mb-3">Lavera Teklif</div>
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button variant={mode === "login" ? "primary" : "ghost"} onClick={() => setMode("login")}>
                Giriş
              </Button>
              <Button variant={mode === "signup" ? "primary" : "ghost"} onClick={() => setMode("signup")}>
                Kayıt
              </Button>
            </div>

            <Input label="Email" value={email} onChange={setEmail} placeholder="mail@..." type="email" />
            <Input label="Şifre" value={pass} onChange={setPass} placeholder="••••••••" type="password" />

            {msg ? <div className="text-sm text-red-300">{msg}</div> : null}

            {mode === "login" ? (
              <Button onClick={doLogin} disabled={!email || !pass}>
                Giriş Yap
              </Button>
            ) : (
              <Button onClick={doSignup} disabled={!email || !pass}>
                Kayıt Ol
              </Button>
            )}

            <div className="text-xs text-white/40">
              Not: Supabase Authentication → Providers → Email açık olmalı.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}