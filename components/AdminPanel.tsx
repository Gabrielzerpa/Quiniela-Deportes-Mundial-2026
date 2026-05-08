"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, ArrowLeft, Check, Clock, Users, Target } from "lucide-react";
import Link from "next/link";

type Partido = {
  id: string; grupo: string; jornada: number; fecha: string;
  equipo_local: string; equipo_visitante: string; estadio: string; resultado: string | null;
};
type Participante = {
  id: string; nombre: string; aciertos_total: number; acerto_goleador: number;
};

interface Props {
  partidos: Partido[];
  participantes: Participante[];
}

const TEAMS: Record<string, { name: string; flag: string }> = {
  MEX: { name: "México", flag: "🇲🇽" }, RSA: { name: "Sudáfrica", flag: "🇿🇦" },
  KOR: { name: "Corea del Sur", flag: "🇰🇷" }, RPD: { name: "Rep. UEFA D", flag: "🏳️" },
  CAN: { name: "Canadá", flag: "🇨🇦" }, RP1: { name: "Rep. UEFA 1", flag: "🏳️" },
  QAT: { name: "Qatar", flag: "🇶🇦" }, SUI: { name: "Suiza", flag: "🇨🇭" },
  BRA: { name: "Brasil", flag: "🇧🇷" }, MAR: { name: "Marruecos", flag: "🇲🇦" },
  HAI: { name: "Haití", flag: "🇭🇹" }, SCO: { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { name: "EE.UU.", flag: "🇺🇸" }, PAR: { name: "Paraguay", flag: "🇵🇾" },
  AUS: { name: "Australia", flag: "🇦🇺" }, RP3: { name: "Rep. UEFA 3", flag: "🏳️" },
  GER: { name: "Alemania", flag: "🇩🇪" }, CUW: { name: "Curazao", flag: "🇨🇼" },
  CIV: { name: "C. de Marfil", flag: "🇨🇮" }, ECU: { name: "Ecuador", flag: "🇪🇨" },
  NED: { name: "P. Bajos", flag: "🇳🇱" }, JPN: { name: "Japón", flag: "🇯🇵" },
  RP2: { name: "Rep. UEFA 2", flag: "🏳️" }, TUN: { name: "Túnez", flag: "🇹🇳" },
  BEL: { name: "Bélgica", flag: "🇧🇪" }, EGY: { name: "Egipto", flag: "🇪🇬" },
  IRN: { name: "Irán", flag: "🇮🇷" }, NZL: { name: "Nueva Zelanda", flag: "🇳🇿" },
  ESP: { name: "España", flag: "🇪🇸" }, CPV: { name: "Cabo Verde", flag: "🇨🇻" },
  KSA: { name: "Arabia Saudita", flag: "🇸🇦" }, URU: { name: "Uruguay", flag: "🇺🇾" },
  FRA: { name: "Francia", flag: "🇫🇷" }, SEN: { name: "Senegal", flag: "🇸🇳" },
  RI2: { name: "Rep. Interc. 2", flag: "🏳️" }, NOR: { name: "Noruega", flag: "🇳🇴" },
  ARG: { name: "Argentina", flag: "🇦🇷" }, ALG: { name: "Argelia", flag: "🇩🇿" },
  AUT: { name: "Austria", flag: "🇦🇹" }, JOR: { name: "Jordania", flag: "🇯🇴" },
  POR: { name: "Portugal", flag: "🇵🇹" }, UZB: { name: "Uzbekistán", flag: "🇺🇿" },
  COL: { name: "Colombia", flag: "🇨🇴" }, RI1: { name: "Rep. Interc. 1", flag: "🏳️" },
  ENG: { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, CRO: { name: "Croacia", flag: "🇭🇷" },
  GHA: { name: "Ghana", flag: "🇬🇭" }, PAN: { name: "Panamá", flag: "🇵🇦" },
};

export default function AdminPanel({ partidos: partidosIniciales, participantes }: Props) {
  const [partidos, setPartidos] = useState(partidosIniciales);
  const [saving, setSaving] = useState<string | null>(null);
  const [filterGrupo, setFilterGrupo] = useState("ALL");
  const [filterPendiente, setFilterPendiente] = useState(false);
  const supabase = createClient();

  const grupos = ["ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const partidosFiltrados = partidos
    .filter(p => filterGrupo === "ALL" || p.grupo === filterGrupo)
    .filter(p => !filterPendiente || p.resultado === null);

  const totalJugados = partidos.filter(p => p.resultado !== null).length;
  const totalPendientes = partidos.filter(p => p.resultado === null).length;

  const handleResultado = async (partidoId: string, resultado: string) => {
    setSaving(partidoId);
    const nuevoResultado = partidos.find(p => p.id === partidoId)?.resultado === resultado ? null : resultado;
    const { error } = await supabase
      .from("partidos")
      .update({ resultado: nuevoResultado, updated_at: new Date().toISOString() })
      .eq("id", partidoId);
    if (!error) {
      setPartidos(prev => prev.map(p =>
        p.id === partidoId ? { ...p, resultado: nuevoResultado } : p
      ));
    }
    setSaving(null);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/[0.04] rounded-full blur-3xl" />
      </div>

      <header className="border-b border-stone-900 bg-stone-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 text-stone-500 hover:text-stone-300 transition">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-amber-600 rounded-xl flex items-center justify-center">
                <Trophy size={18} className="text-stone-900" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-black text-base leading-none text-stone-100">
                  QUINIELA<span className="text-amber-400">26</span>
                  <span className="ml-2 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded font-bold tracking-wider">ADMIN</span>
                </div>
                <div className="text-[9px] text-stone-500 tracking-widest">Panel de resultados</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg">
              <Check size={12} className="text-emerald-400" />
              <span className="text-xs font-bold text-stone-200">{totalJugados}</span>
              <span className="text-[10px] text-stone-500">jugados</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg">
              <Clock size={12} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200">{totalPendientes}</span>
              <span className="text-[10px] text-stone-500">pendientes</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-amber-400">{participantes.length}</div>
            <div className="text-xs text-stone-400 mt-1 flex items-center justify-center gap-1"><Users size={11} />Participantes</div>
          </div>
          <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-emerald-400">{totalJugados}</div>
            <div className="text-xs text-stone-400 mt-1 flex items-center justify-center gap-1"><Check size={11} />Cargados</div>
          </div>
          <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-stone-300">{totalPendientes}</div>
            <div className="text-xs text-stone-400 mt-1 flex items-center justify-center gap-1"><Clock size={11} />Por jugar</div>
          </div>
        </div>

        {participantes.length > 0 && (
          <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">Posiciones actuales</span>
            </div>
            <div className="space-y-1.5">
              {participantes.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 text-sm">
                  <div className="w-6 text-center font-black text-stone-500 text-xs">{idx + 1}</div>
                  <div className="flex-1 font-medium text-stone-200 truncate">{p.nombre}</div>
                  <div className="font-mono font-bold text-emerald-400">{p.aciertos_total}</div>
                  {p.acerto_goleador === 1 && <span className="text-amber-400 text-xs">⚽</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
            {grupos.map(g => (
              <button key={g} onClick={() => setFilterGrupo(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border transition-all ${
                  filterGrupo === g ? "bg-amber-400 text-stone-900 border-transparent" : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"
                }`}>
                {g === "ALL" ? "Todos" : `Grupo ${g}`}
              </button>
            ))}
          </div>
          <button onClick={() => setFilterPendiente(!filterPendiente)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-shrink-0 ${
              filterPendiente ? "bg-amber-400/20 text-amber-300 border-amber-700/40" : "bg-stone-900/60 text-stone-400 border-stone-800"
            }`}>
            Solo pendientes
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {partidosFiltrados.map(partido => {
            const home = TEAMS[partido.equipo_local];
            const away = TEAMS[partido.equipo_visitante];
            const fecha = new Date(partido.fecha).toLocaleDateString("es-MX", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              timeZone: "America/Mexico_City"
            });
            return (
              <div key={partido.id} className={`bg-stone-900/40 border rounded-2xl p-4 ${partido.resultado ? "border-emerald-800/30" : "border-stone-800/60"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] text-stone-500 flex items-center gap-2">
                    <span className="font-bold text-stone-400">Grupo {partido.grupo}</span>
                    <span>·</span><span>{fecha}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {saving === partido.id && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
                    {partido.resultado && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400">✓ Cargado</span>}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
                  <div className="text-right">
                    <div className="text-xl mb-0.5">{home?.flag}</div>
                    <div className="font-bold text-xs text-stone-100">{home?.name}</div>
                  </div>
                  <div className="text-stone-700 font-mono text-xs">vs</div>
                  <div className="text-left">
                    <div className="text-xl mb-0.5">{away?.flag}</div>
                    <div className="font-bold text-xs text-stone-100">{away?.name}</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { val: "1", label: `Gana ${partido.equipo_local}` },
                    { val: "X", label: "Empate" },
                    { val: "2", label: `Gana ${partido.equipo_visitante}` },
                  ].map(({ val, label }) => (
                    <button key={val} onClick={() => handleResultado(partido.id, val)} disabled={saving === partido.id}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border ${
                        partido.resultado === val
                          ? "bg-emerald-400 text-stone-900 border-transparent shadow-md"
                          : "bg-stone-950/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                {partido.estadio && <div className="text-[10px] text-stone-600 mt-2 text-center truncate">{partido.estadio}</div>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
