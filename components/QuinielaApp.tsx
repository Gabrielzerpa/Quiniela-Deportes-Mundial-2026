"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Lock, Clock, Sparkles, Target, TrendingUp, Eye, EyeOff, Goal, LogOut, ChevronRight } from "lucide-react";
import TablaPredicciones from "@/components/TablaPrediciones";

const TEAMS: Record<string, { name: string; flag: string }> = {
  MEX: { name: "México", flag: "🇲🇽" }, RSA: { name: "Sudáfrica", flag: "🇿🇦" },
  KOR: { name: "Corea del Sur", flag: "🇰🇷" }, CZE: { name: "Rep. Checa", flag: "🇨🇿" },
  CAN: { name: "Canadá", flag: "🇨🇦" }, BIH: { name: "Bosnia y Herz.", flag: "🇧🇦" },
  QAT: { name: "Qatar", flag: "🇶🇦" }, SUI: { name: "Suiza", flag: "🇨🇭" },
  BRA: { name: "Brasil", flag: "🇧🇷" }, MAR: { name: "Marruecos", flag: "🇲🇦" },
  HAI: { name: "Haití", flag: "🇭🇹" }, SCO: { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { name: "EE.UU.", flag: "🇺🇸" }, PAR: { name: "Paraguay", flag: "🇵🇾" },
  AUS: { name: "Australia", flag: "🇦🇺" }, SWE: { name: "Suecia", flag: "🇸🇪" },
  GER: { name: "Alemania", flag: "🇩🇪" }, CUW: { name: "Curazao", flag: "🇨🇼" },
  CIV: { name: "C. de Marfil", flag: "🇨🇮" }, ECU: { name: "Ecuador", flag: "🇪🇨" },
  NED: { name: "P. Bajos", flag: "🇳🇱" }, JPN: { name: "Japón", flag: "🇯🇵" },
  TUR: { name: "Turquía", flag: "🇹🇷" }, TUN: { name: "Túnez", flag: "🇹🇳" },
  BEL: { name: "Bélgica", flag: "🇧🇪" }, EGY: { name: "Egipto", flag: "🇪🇬" },
  IRN: { name: "Irán", flag: "🇮🇷" }, NZL: { name: "Nueva Zelanda", flag: "🇳🇿" },
  ESP: { name: "España", flag: "🇪🇸" }, CPV: { name: "Cabo Verde", flag: "🇨🇻" },
  KSA: { name: "Arabia Saudita", flag: "🇸🇦" }, URU: { name: "Uruguay", flag: "🇺🇾" },
  FRA: { name: "Francia", flag: "🇫🇷" }, SEN: { name: "Senegal", flag: "🇸🇳" },
  COD: { name: "RD Congo", flag: "🇨🇩" }, NOR: { name: "Noruega", flag: "🇳🇴" },
  ARG: { name: "Argentina", flag: "🇦🇷" }, ALG: { name: "Argelia", flag: "🇩🇿" },
  AUT: { name: "Austria", flag: "🇦🇹" }, JOR: { name: "Jordania", flag: "🇯🇴" },
  POR: { name: "Portugal", flag: "🇵🇹" }, UZB: { name: "Uzbekistán", flag: "🇺🇿" },
  COL: { name: "Colombia", flag: "🇨🇴" }, IRQ: { name: "Iraq", flag: "🇮🇶" },
  ENG: { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, CRO: { name: "Croacia", flag: "🇭🇷" },
  GHA: { name: "Ghana", flag: "🇬🇭" }, PAN: { name: "Panamá", flag: "🇵🇦" },
  POL: { name: "Polonia", flag: "🇵🇱" },
  NGA: { name: "Nigeria", flag: "🇳🇬" },
};

type Partido = {
  id: string; grupo: string; jornada: number; fecha: string;
  equipo_local: string; equipo_visitante: string; estadio: string; resultado: string | null;
};
type Prediccion = { partido_id: string; prediccion: string };
type PrediccionElim = { llave_id: string; equipo_pick: string };
type Posicion = {
  id: string; nombre: string; aciertos_grupos: number;
  aciertos_eliminatorias: number; aciertos_total: number; acerto_goleador: number;
};
type Goleador = { id: string; nombre: string; equipo: string };
type Llave = {
  id: string; ronda: string; fecha: string;
  equipo_local: string | null; equipo_visitante: string | null;
  placeholder_local: string; placeholder_visitante: string;
  ganador: string | null; estadio: string;
};

interface Props {
  participante: { id: string; nombre: string; email: string; es_admin: boolean; goleador_pick: string | null };
  partidos: Partido[];
  prediccionesIniciales: Prediccion[];
  posiciones: Posicion[];
  goleadores: Goleador[];
  deadline: string;
  deadlineElim: string;
  llaves: Llave[];
  prediccionesElimIniciales: PrediccionElim[];
}

function useCountdown(target: string) {
  const calc = () => {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);
  return time;
}

const RONDAS = [
  { key: "16vos", label: "16vos de Final" },
  { key: "8vos", label: "Octavos" },
  { key: "4tos", label: "Cuartos" },
  { key: "semi", label: "Semifinales" },
  { key: "final", label: "Final" },
];

export default function QuinielaApp({
  participante, partidos, prediccionesIniciales, posiciones,
  goleadores, deadline, deadlineElim, llaves, prediccionesElimIniciales
}: Props) {
  const [tab, setTab] = useState<"groups" | "knockout" | "leaderboard" | "tabla">("groups");
  const [preds, setPreds] = useState<Record<string, string>>(
    Object.fromEntries(prediccionesIniciales.map(p => [p.partido_id, p.prediccion]))
  );
  const [predsElim, setPredsElim] = useState<Record<string, string>>(
    Object.fromEntries(prediccionesElimIniciales.map(p => [p.llave_id, p.equipo_pick]))
  );
  const [goleadorPick, setGoleadorPick] = useState(participante.goleador_pick || "");
  const [saving, setSaving] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const [filterGrupo, setFilterGrupo] = useState("ALL");
  const [activeRonda, setActiveRonda] = useState("16vos");
  const countdown = useCountdown(deadline);
  const countdownElim = useCountdown(deadlineElim);
  const supabase = createClient();
  const locked = countdown.expired;
  const lockedElim = countdownElim.expired;

  const grupos = ["ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const partidosFiltrados = filterGrupo === "ALL" ? partidos : partidos.filter(p => p.grupo === filterGrupo);
  const llavesRonda = llaves.filter(l => l.ronda === activeRonda);

  const handlePredict = useCallback(async (partidoId: string, value: string) => {
    if (locked) return;
    setPreds(prev => ({ ...prev, [partidoId]: value }));
    setSaving(partidoId);
    await supabase.from("predicciones_grupos").upsert({
      participante_id: participante.id,
      partido_id: partidoId,
      prediccion: value,
      updated_at: new Date().toISOString(),
    }, { onConflict: "participante_id,partido_id" });
    setSaving(null);
  }, [locked, participante.id]);

  const handlePredictElim = useCallback(async (llaveId: string, equipoPick: string) => {
    if (lockedElim) return;
    const current = predsElim[llaveId];
    const newPick = current === equipoPick ? "" : equipoPick;
    setPredsElim(prev => ({ ...prev, [llaveId]: newPick }));
    setSaving(llaveId);
    if (newPick) {
      await supabase.from("predicciones_eliminatorias").upsert({
        participante_id: participante.id,
        llave_id: llaveId,
        equipo_pick: newPick,
        updated_at: new Date().toISOString(),
      }, { onConflict: "participante_id,llave_id" });
    } else {
      await supabase.from("predicciones_eliminatorias")
        .delete()
        .eq("participante_id", participante.id)
        .eq("llave_id", llaveId);
    }
    setSaving(null);
  }, [lockedElim, participante.id]);

  const handleGoleador = async (nombre: string) => {
    setGoleadorPick(nombre);
    await supabase.from("participantes").update({ goleador_pick: nombre }).eq("id", participante.id);
  };

  const totalPreds = Object.keys(preds).length;
  const completion = partidos.length > 0 ? Math.round((totalPreds / partidos.length) * 100) : 0;
  const miPosicion = posiciones.findIndex(p => p.id === participante.id) + 1;
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-3xl" />
      </div>

      <header className="border-b border-stone-900 bg-stone-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Trophy size={18} className="text-stone-900" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-black text-base leading-none text-stone-100">QUINIELA<span className="text-amber-400">26</span></div>
              <div className="text-[9px] text-stone-500 tracking-widest">MUNDIAL · USA · MEX · CAN</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === "knockout" ? (
              !lockedElim ? (
                <div className="bg-stone-900/60 border border-stone-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <Clock size={12} className="text-purple-400" />
                  <span className="font-mono text-xs text-stone-100">
                    <span className="text-purple-400 font-bold">{countdownElim.days}</span>d{" "}
                    <span className="text-purple-400 font-bold">{countdownElim.hours}</span>h{" "}
                    <span className="text-purple-400 font-bold">{countdownElim.minutes}</span>m
                  </span>
                </div>
              ) : (
                <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <Lock size={12} className="text-red-400" />
                  <span className="text-xs text-red-300 font-bold">Cerrado</span>
                </div>
              )
            ) : !locked ? (
              <div className="bg-stone-900/60 border border-stone-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <Clock size={12} className="text-amber-400" />
                <span className="font-mono text-xs text-stone-100">
                  <span className="text-amber-400 font-bold">{countdown.days}</span>d{" "}
                  <span className="text-amber-400 font-bold">{countdown.hours}</span>h{" "}
                  <span className="text-amber-400 font-bold">{countdown.minutes}</span>m{" "}
                  <span className="text-amber-400 font-bold">{countdown.seconds}</span>s
                </span>
              </div>
            ) : (
              <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <Lock size={12} className="text-red-400" />
                <span className="text-xs text-red-300 font-bold">Cerrado</span>
              </div>
            )}
            {participante.es_admin && (
              <a href="/admin" className="px-2 py-1.5 bg-amber-400/20 border border-amber-700/40 rounded-lg text-[10px] font-bold text-amber-300 hover:bg-amber-400/30 transition">
                ADMIN
              </a>
            )}
            <form action="/auth/signout" method="post">
              <button className="p-2 text-stone-500 hover:text-stone-300 transition">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 border-t border-stone-900 overflow-x-auto">
          {[
            { key: "groups", label: "Fase de grupos", icon: Target },
            { key: "knockout", label: "Eliminatorias", icon: Trophy },
            { key: "leaderboard", label: "Posiciones", icon: TrendingUp },
            { key: "tabla", label: "Predicciones", icon: Eye },          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as typeof tab)}
              className={`relative px-4 py-2.5 font-bold text-xs tracking-wide flex items-center gap-1.5 transition-colors flex-shrink-0 ${tab === key ? "text-stone-100" : "text-stone-500 hover:text-stone-300"}`}>
              <Icon size={13} />{label}
              {tab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-4 mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[10px] font-bold tracking-widest text-amber-400 uppercase mb-1">Tu progreso · grupos</div>
            <div className="text-xl font-black text-stone-100">
              {totalPreds} <span className="text-stone-600 font-normal text-sm">de {partidos.length} predicciones</span>
            </div>
            <div className="mt-2 h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-widest text-stone-500 uppercase mb-0.5">Tu posición</div>
            <div className="text-2xl font-black text-amber-400">#{miPosicion || "—"}</div>
            <div className="text-[10px] text-stone-500">DE {posiciones.length}</div>
          </div>
        </div>

        {tab === "groups" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-black text-stone-100">Fase de grupos</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {locked ? "Predicciones cerradas." : <><span className="text-amber-400 font-bold">1 punto</span> por acierto · Guarda automáticamente</>}
                </p>
              </div>
              <button onClick={() => setShowOthers(!showOthers)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg text-xs text-stone-400 hover:text-stone-200 transition">
                {showOthers ? <Eye size={12} /> : <EyeOff size={12} />}
                {showOthers ? "Ocultar" : "Ver"} predicciones del grupo
              </button>
            </div>
            {!showOthers && !locked && (
              <div className="bg-stone-900/40 border border-stone-800/60 border-dashed rounded-xl p-3 mb-4 flex items-center gap-2">
                <Lock size={12} className="text-stone-500" />
                <p className="text-xs text-stone-400">Las predicciones de los demás se revelan al pitazo inicial del 11 jun.</p>
              </div>
            )}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
              {grupos.map(g => (
                <button key={g} onClick={() => setFilterGrupo(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border transition-all ${
                    filterGrupo === g ? "bg-amber-400 text-stone-900 border-transparent" : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"
                  }`}>
                  {g === "ALL" ? "Todos" : `Grupo ${g}`}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {partidosFiltrados.map(partido => {
                const home = TEAMS[partido.equipo_local];
                const away = TEAMS[partido.equipo_visitante];
                const pred = preds[partido.id];
                const isInaugural = partido.id === "A1";
                const fecha = new Date(partido.fecha).toLocaleDateString("es-MX", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  timeZone: "America/Mexico_City"
                });
                return (
                  <div key={partido.id} className={`bg-stone-900/40 border rounded-2xl overflow-hidden ${isInaugural ? "border-amber-500/40 shadow-lg shadow-amber-950/20" : "border-stone-800/60"}`}>
                    {isInaugural && (
                      <div className="bg-gradient-to-r from-amber-500/20 to-transparent px-4 py-1.5 flex items-center gap-2 border-b border-amber-500/20">
                        <Sparkles size={11} className="text-amber-400" />
                        <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">Partido inaugural</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[10px] text-stone-500">
                          <span className="font-bold text-stone-400">Grupo {partido.grupo}</span>
                          <span>·</span><span>{fecha}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {saving === partido.id && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
                          {partido.resultado && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pred === partido.resultado ? "bg-emerald-400/20 text-emerald-400" : "bg-red-950/40 text-red-400"}`}>
                              {pred === partido.resultado ? "✓ Acierto" : "✗ Fallo"}
                            </span>
                          )}
                          {locked && !partido.resultado && <Lock size={11} className="text-stone-600" />}
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
                        <div className="text-right">
                          <div className="text-2xl mb-0.5">{home?.flag}</div>
                          <div className="font-bold text-xs text-stone-100">{home?.name}</div>
                        </div>
                        <div className="text-stone-700 font-mono text-xs">vs</div>
                        <div className="text-left">
                          <div className="text-2xl mb-0.5">{away?.flag}</div>
                          <div className="font-bold text-xs text-stone-100">{away?.name}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {[
                          { val: "1", label: partido.equipo_local },
                          { val: "X", label: "Empate" },
                          { val: "2", label: partido.equipo_visitante },
                        ].map(({ val, label }) => (
                          <button key={val} onClick={() => handlePredict(partido.id, val)} disabled={locked}
                            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border ${
                              pred === val
                                ? "bg-emerald-400 text-stone-900 border-transparent shadow-md scale-[1.02]"
                                : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {partido.estadio && <div className="text-[10px] text-stone-600 mt-2 text-center truncate">{partido.estadio}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 bg-gradient-to-br from-amber-950/40 to-stone-900/40 border border-amber-800/40 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Goal size={20} className="text-stone-900" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-stone-100">Goleador del torneo</h3>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded font-bold tracking-wider">DESEMPATE</span>
                  </div>
                  <p className="text-xs text-stone-400">Si hay empate en aciertos, gana quien acertó al goleador.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {goleadores.map(g => (
                  <button key={g.id} onClick={() => !locked && handleGoleador(g.nombre)} disabled={locked}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      goleadorPick === g.nombre ? "bg-amber-400/15 border-amber-500/60" : "bg-stone-950/40 border-stone-900 hover:border-stone-800 disabled:opacity-40"
                    }`}>
                    <span className="text-lg">{TEAMS[g.equipo]?.flag || "⚽"}</span>
                    <div>
                      <div className={`text-xs font-bold truncate ${goleadorPick === g.nombre ? "text-amber-200" : "text-stone-200"}`}>{g.nombre}</div>
                      <div className="text-[10px] text-stone-500">{g.equipo}</div>
                    </div>
                  </button>
                ))}
                <button onClick={() => !locked && handleGoleador("otro")} disabled={locked}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                  goleadorPick && !goleadores.find(g => g.nombre === goleadorPick)
                    ? "bg-amber-400/15 border-amber-500/60"
                    : "bg-stone-950/40 border-stone-900 hover:border-stone-800 disabled:opacity-40"
                }`}>
                <span className="text-lg">⚽</span>
                <div>
                  <div className="text-xs font-bold text-stone-200">Otro jugador</div>
                  <div className="text-[10px] text-stone-500">Escribe el nombre</div>
                </div>
              </button>
              </div>
              {goleadorPick && goleadores.find(g => g.nombre === goleadorPick) && (
                <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Seleccionaste: <span className="font-bold">{goleadorPick}</span>
                </div>
              )}
              {goleadorPick && !goleadores.find(g => g.nombre === goleadorPick) && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del jugador..."
                    defaultValue={goleadorPick === "otro" ? "" : goleadorPick}
                    id="custom-scorer"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) handleGoleador(val);
                      }
                    }}
                    className="flex-1 bg-stone-950/60 border border-amber-700/40 rounded-lg px-4 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/60"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("custom-scorer") as HTMLInputElement;
                      if (input?.value.trim()) handleGoleador(input.value.trim());
                    }}
                    className="px-4 py-2.5 bg-amber-400 text-stone-900 rounded-lg font-bold text-xs hover:bg-amber-300 transition">
                    Guardar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "knockout" && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-black text-stone-100">Fase eliminatoria</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {lockedElim ? "Predicciones cerradas." : <><span className="text-amber-400 font-bold">1 punto</span> por acierto · Predice quién pasa de cada llave</>}
              </p>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5">
              {RONDAS.map(r => (
                <button key={r.key} onClick={() => setActiveRonda(r.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border transition-all ${
                    activeRonda === r.key ? "bg-amber-400 text-stone-900 border-transparent" : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {llavesRonda.map(llave => {
                const localCode = llave.equipo_local;
                const visitanteCode = llave.equipo_visitante;
                const localTeam = localCode ? TEAMS[localCode] : null;
                const visitanteTeam = visitanteCode ? TEAMS[visitanteCode] : null;
                const definida = !!(localCode && visitanteCode);
                const pred = predsElim[llave.id];
                const fecha = new Date(llave.fecha).toLocaleDateString("es-MX", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  timeZone: "America/Mexico_City"
                });
                return (
                  <div key={llave.id} className={`bg-stone-900/40 border rounded-2xl p-4 ${!definida ? "opacity-60" : ""} ${llave.ganador ? "border-emerald-800/30" : "border-stone-800/60"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] text-stone-500 flex items-center gap-2">
                        <span className="font-bold text-purple-400">{llave.id}</span>
                        <span>·</span><span>{fecha}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {saving === llave.id && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
                        {llave.ganador && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pred === llave.ganador ? "bg-emerald-400/20 text-emerald-400" : pred ? "bg-red-950/40 text-red-400" : "bg-stone-800 text-stone-500"}`}>
                            {pred === llave.ganador ? "✓ Acierto" : pred ? "✗ Fallo" : "Sin pred."}
                          </span>
                        )}
                        {!definida && <span className="text-[10px] text-stone-600 font-bold">Por definir</span>}
                      </div>
                    </div>
                    {definida ? (
                      <>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
                          <div className="text-right">
                            <div className="text-2xl mb-0.5">{localTeam?.flag || "🏳️"}</div>
                            <div className="font-bold text-xs text-stone-100">{localTeam?.name || localCode}</div>
                          </div>
                          <div className="text-stone-700 font-mono text-xs">vs</div>
                          <div className="text-left">
                            <div className="text-2xl mb-0.5">{visitanteTeam?.flag || "🏳️"}</div>
                            <div className="font-bold text-xs text-stone-100">{visitanteTeam?.name || visitanteCode}</div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {[
                            { val: localCode!, label: localTeam?.name || localCode! },
                            { val: visitanteCode!, label: visitanteTeam?.name || visitanteCode! },
                          ].map(({ val, label }) => (
                            <button key={val} onClick={() => handlePredictElim(llave.id, val)} disabled={lockedElim}
                              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border ${
                                pred === val
                                  ? "bg-emerald-400 text-stone-900 border-transparent shadow-md"
                                  : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
                              }`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between py-3">
                        <div className="text-center flex-1">
                          <div className="text-stone-600 text-xs font-mono">{llave.placeholder_local}</div>
                        </div>
                        <ChevronRight size={14} className="text-stone-700" />
                        <div className="text-center flex-1">
                          <div className="text-stone-600 text-xs font-mono">{llave.placeholder_visitante}</div>
                        </div>
                      </div>
                    )}
                    {llave.estadio && <div className="text-[10px] text-stone-600 mt-2 text-center truncate">{llave.estadio}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-stone-100">Tabla de posiciones</h2>
                <p className="text-xs text-stone-500 mt-0.5">Actualizada con los resultados del Mundial</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">En vivo</span>
              </div>
            </div>
            {posiciones.length === 0 ? (
              <div className="text-center py-16 text-stone-500">
                <Trophy size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Las posiciones aparecerán cuando se jueguen los primeros partidos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posiciones.map((p, idx) => {
                  const isMe = p.id === participante.id;
                  const rank = idx + 1;
                  const medalColors: Record<number, string> = {
                    1: "from-amber-300 to-amber-500",
                    2: "from-stone-300 to-stone-400",
                    3: "from-orange-400 to-orange-600",
                  };
                  return (
                    <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? "bg-amber-950/30 border-amber-700/50" : "bg-stone-900/40 border-stone-800/60"}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
                        medalColors[rank] ? `bg-gradient-to-br ${medalColors[rank]} text-stone-900` : "bg-stone-900 text-stone-400 border border-stone-800"
                      }`}>{rank}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-stone-100 flex items-center gap-2 flex-wrap">
                          {p.nombre}
                          {isMe && <span className="text-[9px] bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded font-black tracking-wider">TÚ</span>}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {p.aciertos_grupos} grupos · {p.aciertos_eliminatorias} eliminatorias
                          {p.acerto_goleador === 1 && <span className="ml-1 text-amber-400">· ⚽ goleador</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-lg text-stone-100">{p.aciertos_total}</div>
                        <div className="text-[10px] text-stone-500">aciertos</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6 p-4 bg-stone-900/40 border border-stone-800 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} className="text-amber-400" />
                <span className="text-xs font-bold text-stone-200 tracking-wider uppercase">Sistema de puntos</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-950/60 rounded-lg p-3 border border-stone-900">
                  <div className="text-stone-400 mb-1">Cualquier acierto</div>
                  <div className="font-mono font-black text-emerald-400 text-xl">+1 punto</div>
                  <div className="text-[10px] text-stone-600 mt-1">Grupos y eliminatorias</div>
                </div>
                <div className="bg-stone-950/60 rounded-lg p-3 border border-amber-900/40">
                  <div className="text-stone-400 mb-1">Desempate</div>
                  <div className="font-mono font-black text-amber-400 text-xl">Goleador</div>
                  <div className="text-[10px] text-stone-600 mt-1">Si persiste → divide el premio</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === "tabla" && (
          <TablaPredicciones
            partidos={partidos}
            participantes={posiciones.map(p => ({ id: p.id, nombre: p.nombre }))}
            esAdmin={participante.es_admin}
            deadlineGrupos={deadline}
            deadlineElim={deadlineElim}
          />
        )}
      </main>
    </div>
  );
}
