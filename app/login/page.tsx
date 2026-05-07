"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { nombre: nombre.trim() || email.split("@")[0] },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 rounded-2xl mb-4 shadow-lg shadow-amber-900/40">
            <Trophy size={28} className="text-stone-900" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-stone-100 tracking-tight">
            QUINIELA<span className="text-amber-400">26</span>
          </h1>
          <p className="text-xs text-stone-400 tracking-[0.2em] mt-2">
            MUNDIAL · USA · MEX · CAN
          </p>
        </div>

        <div className="bg-stone-900/40 backdrop-blur border border-stone-800 rounded-2xl p-6">
          {!sent ? (
            <form onSubmit={handleLogin}>
              <h2 className="text-lg font-bold text-stone-100 mb-1">
                Entra a la quiniela
              </h2>
              <p className="text-sm text-stone-400 mb-6">
                Te enviaremos un link de acceso a tu correo.
              </p>

              <label className="block text-xs font-bold tracking-wider text-stone-400 uppercase mb-2">
                Tu nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Como aparecerás en el ranking"
                className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 mb-4"
              />

              <label className="block text-xs font-bold tracking-wider text-stone-400 uppercase mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60 mb-6"
              />

              {error && (
                <div className="bg-red-950/40 border border-red-800/40 rounded-lg p-3 mb-4 text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-stone-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-amber-900/40"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Enviar link de acceso
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-400/20 rounded-full mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-stone-100 mb-2">
                ¡Revisa tu correo!
              </h2>
              <p className="text-sm text-stone-400 leading-relaxed">
                Te enviamos un link de acceso a <span className="text-amber-400 font-bold">{email}</span>.
                Haz click en el link para entrar.
              </p>
              <p className="text-xs text-stone-500 mt-4">
                Si no llega en 1 minuto, revisa la carpeta de spam.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
