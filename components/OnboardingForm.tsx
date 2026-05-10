"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";

export default function OnboardingForm({ participanteId }: { participanteId: string }) {
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleGuardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) { setError("Escribe tu nombre"); return; }
    setGuardando(true);
    setError("");

    const { data: existe } = await supabase
      .from("participantes")
      .select("id")
      .eq("nombre", nombreLimpio)
      .neq("id", participanteId)
      .single();

    if (existe) {
      setError("Ese nombre ya está en uso, elige otro");
      setGuardando(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("participantes")
      .update({ nombre: nombreLimpio, nombre_confirmado: true })
      .eq("id", participanteId);

    if (!updateError) {
      router.push("/");
    } else {
      setError("Error al guardar, intenta de nuevo");
    }
    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy size={22} className="text-stone-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-stone-100 text-lg leading-none">¡Bienvenido!</h1>
              <p className="text-[10px] text-stone-500 mt-0.5">Quiniela Mundial 2026 · Grupo Deportes</p>
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 mb-5">
            <p className="text-xs text-amber-200 leading-relaxed">
              Antes de entrar, elige el nombre con el que aparecerás en la quiniela. Será visible para todos los participantes.
            </p>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold tracking-widest text-stone-500 uppercase mb-2 block">
              Tu nombre de participante
            </label>
            <input
              type="text"
              placeholder="Ej: Gabriel, El Profe, Messi..."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGuardar()}
              maxLength={30}
              autoFocus
              className="w-full bg-stone-950/60 border border-stone-700 rounded-lg px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60"
            />
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          <button onClick={handleGuardar} disabled={guardando}
            className="w-full py-3 bg-amber-400 text-stone-900 rounded-xl font-black text-sm hover:bg-amber-300 transition disabled:opacity-50 mb-3">
            {guardando ? "Guardando..." : "Entrar a la quiniela 🏆"}
          </button>

          <p className="text-[10px] text-stone-600 text-center">
            Cero lloradera, cero galleta.
          </p>
        </div>
      </div>
    </div>
  );
}
