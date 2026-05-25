"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Mail, Loader2, CheckCircle2, Lock, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [mode, setMode] = useState<"magic" | "password" | "register" | "forgot">("magic");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const supabase = createClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) setError("Correo o contraseña incorrectos");
      else window.location.href = "/";

    } else if (mode === "register") {
      if (password !== passwordConfirm) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) setError(error.message);
      else setSent(true);

    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      setLoading(false);
      if (error) setError(error.message);
      else setSuccess("Te enviamos un link para restablecer tu contraseña.");

    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) setError(error.message);
      else setSent(true);
    }
  };

  const titles = {
    magic: "Entra a la quiniela",
    password: "Entra a la quiniela",
    register: "Crear cuenta",
    forgot: "Recuperar contraseña",
  };

  const subtitles = {
    magic: "Te enviaremos un link de acceso.",
    password: "Ingresa con tu correo y contraseña.",
    register: "Crea tu cuenta con correo y contraseña.",
    forgot: "Te enviaremos un link para restablecer tu contraseña.",
  };

  const sentMessages = {
    magic: `Te enviamos un link a ${email}. Abre el link desde tu navegador (no desde Gmail).`,
    register: `Te enviamos un correo de confirmación a ${email}. Confirma tu cuenta para entrar.`,
    forgot: "",
    password: "",
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 rounded-2xl mb-4 shadow-lg shadow-amber-900/40">
            <Trophy size={28} className="text-stone-900" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-stone-100 tracking-tight">
            QUINIELA<span className="text-amber-400">26</span>
          </h1>
          <p className="text-xs text-stone-400 tracking-[0.2em] mt-2">MUNDIAL · USA · MEX · CAN</p>
        </div>

        <div className="bg-stone-900/40 backdrop-blur border border-stone-800 rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-400/20 rounded-full mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-stone-100 mb-2">¡Revisa tu correo!</h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                {sentMessages[mode as keyof typeof sentMessages]}
              </p>
              {mode === "magic" && (
                <div className="mt-4 bg-amber-950/30 border border-amber-800/40 rounded-lg p-3">
                  <p className="text-xs text-amber-300">💡 Abre el link desde Safari o Chrome, no desde el navegador interno de Gmail.</p>
                </div>
              )}
              <p className="text-xs text-stone-500 mt-4">Si no llega, revisa spam.</p>
              <button onClick={() => { setSent(false); setError(""); }}
                className="mt-4 text-xs text-amber-400 hover:text-amber-300 transition">
                ← Volver
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-bold text-stone-100 mb-1">{titles[mode]}</h2>
              <p className="text-sm text-stone-400 mb-5">{subtitles[mode]}</p>

              <label className="block text-xs font-bold tracking-wider text-stone-400 uppercase mb-2">
                Correo electrónico
              </label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 mb-4"
              />

              {(mode === "password" || mode === "register") && (
                <>
                  <label className="block text-xs font-bold tracking-wider text-stone-400 uppercase mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 mb-4"
                  />
                </>
              )}

              {mode === "register" && (
                <>
                  <label className="block text-xs font-bold tracking-wider text-stone-400 uppercase mb-2">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password" required value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 mb-4"
                  />
                </>
              )}

              {error && (
                <div className="bg-red-950/40 border border-red-800/40 rounded-lg p-3 mb-4 text-xs text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-3 mb-4 text-xs text-emerald-300">
                  {success}
                </div>
              )}

              <button type="submit" disabled={loading || !email}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-stone-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-amber-900/40 mb-4">
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" />Procesando...</>
                ) : mode === "password" ? (
                  <><Lock size={16} />Entrar</>
                ) : mode === "register" ? (
                  <><UserPlus size={16} />Crear cuenta</>
                ) : mode === "forgot" ? (
                  <><Mail size={16} />Enviar link de recuperación</>
                ) : (
                  <><Mail size={16} />Enviar link de acceso</>
                )}
              </button>

              <div className="flex flex-col gap-2">
                {mode !== "magic" && (
                  <button type="button" onClick={() => { setMode("magic"); setError(""); setSuccess(""); }}
                    className="w-full text-xs text-stone-500 hover:text-stone-300 transition py-1">
                    ¿Prefieres recibir un link por correo?
                  </button>
                )}
                {mode !== "password" && mode !== "register" && (
                  <button type="button" onClick={() => { setMode("password"); setError(""); setSuccess(""); }}
                    className="w-full text-xs text-stone-500 hover:text-stone-300 transition py-1">
                    ¿Prefieres entrar con contraseña?
                  </button>
                )}
                {mode === "password" && (
                  <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                    className="w-full text-xs text-stone-500 hover:text-stone-300 transition py-1">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
                {mode !== "register" && (
                  <button type="button" onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                    className="w-full text-xs text-amber-600 hover:text-amber-400 transition py-1 font-bold">
                    ¿No tienes cuenta? Regístrate aquí
                  </button>
                )}
                {mode === "register" && (
                  <button type="button" onClick={() => { setMode("password"); setError(""); setSuccess(""); }}
                    className="w-full text-xs text-stone-500 hover:text-stone-300 transition py-1">
                    ¿Ya tienes cuenta? Inicia sesión
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
