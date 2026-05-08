"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, ArrowLeft, Check, Clock, Users, Target, Trash2, DollarSign, ChevronUp, Eye } from "lucide-react";
import Link from "next/link";

type Partido = {
  id: string; grupo: string; jornada: number; fecha: string;
  equipo_local: string; equipo_visitante: string; estadio: string; resultado: string | null;
};
type Participante = {
  id: string; nombre: string; email: string; aciertos_total: number;
  acerto_goleador: number; goleador_pick: string | null;
};
type Llave = {
  id: string; ronda: string; fecha: string;
  equipo_local: string | null; equipo_visitante: string | null;
  placeholder_local: string; placeholder_visitante: string;
  ganador: string | null; estadio: string;
};
type PrediccionDetalle = { partido_id: string; prediccion: string };

interface Props {
  partidos: Partido[];
  participantes: Participante[];
  llaves: Llave[];
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

const TEAM_OPTIONS = Object.entries(TEAMS).map(([code, t]) => ({ code, ...t }));
const RONDAS = ["16vos", "8vos", "4tos", "semi", "final"];

export default function AdminPanel({ partidos: partidosIniciales, participantes: participantesIniciales, llaves: llavesIniciales }: Props) {
  const [tab, setTab] = useState<"resultados" | "participantes" | "eliminatorias">("resultados");
  const [partidos, setPartidos] = useState(partidosIniciales);
  const [participantes, setParticipantes] = useState(participantesIniciales.map(p => ({ ...p, pagado: false })));
  const [llaves, setLlaves] = useState(llavesIniciales);
  const [saving, setSaving] = useState<string | null>(null);
  const [filterGrupo, setFilterGrupo] = useState("ALL");
  const [filterPendiente, setFilterPendiente] = useState(false);
  const [activeRonda, setActiveRonda] = useState("16vos");
  const [expandedParticipante, setExpandedParticipante] = useState<string | null>(null);
  const [prediccionesDetalle, setPrediccionesDetalle] = useState<Record<string, PrediccionDetalle[]>>({});
  const [loadingPreds, setLoadingPreds] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingLlave, setEditingLlave] = useState<string | null>(null);
  const [llaveLocal, setLlaveLocal] = useState("");
  const [llaveVisitante, setLlaveVisitante] = useState("");
  const supabase = createClient();

  const grupos = ["ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const partidosFiltrados = partidos
    .filter(p => filterGrupo === "ALL" || p.grupo === filterGrupo)
    .filter(p => !filterPendiente || p.resultado === null);
  const totalJugados = partidos.filter(p => p.resultado !== null).length;
  const totalPendientes = partidos.filter(p => p.resultado === null).length;
  const totalPagados = participantes.filter(p => p.pagado).length;
  const llavesRonda = llaves.filter(l => l.ronda === activeRonda);

  const handleResultado = async (partidoId: string, resultado: string) => {
    setSaving(partidoId);
    const nuevoResultado = partidos.find(p => p.id === partidoId)?.resultado === resultado ? null : resultado;
    const { error } = await supabase.from("partidos")
      .update({ resultado: nuevoResultado, updated_at: new Date().toISOString() })
      .eq("id", partidoId);
    if (!error) setPartidos(prev => prev.map(p => p.id === partidoId ? { ...p, resultado: nuevoResultado } : p));
    setSaving(null);
  };

  const handleGanadorLlave = async (llaveId: string, ganador: string) => {
    setSaving(llaveId);
    const current = llaves.find(l => l.id === llaveId)?.ganador;
    const nuevoGanador = current === ganador ? null : ganador;
    const { error } = await supabase.from("llaves_eliminatorias")
      .update({ ganador: nuevoGanador, updated_at: new Date().toISOString() })
      .eq("id", llaveId);
    if (!error) setLlaves(prev => prev.map(l => l.id === llaveId ? { ...l, ganador: nuevoGanador } : l));
    setSaving(null);
  };

  const handleDefinirLlave = async (llaveId: string) => {
    if (!llaveLocal || !llaveVisitante) return;
    setSaving(llaveId);
    const { error } = await supabase.from("llaves_eliminatorias")
      .update({ equipo_local: llaveLocal, equipo_visitante: llaveVisitante, updated_at: new Date().toISOString() })
      .eq("id", llaveId);
    if (!error) {
      setLlaves(prev => prev.map(l => l.id === llaveId ? { ...l, equipo_local: llaveLocal, equipo_visitante: llaveVisitante } : l));
      setEditingLlave(null);
      setLlaveLocal("");
      setLlaveVisitante("");
    }
    setSaving(null);
  };

  const togglePagado = async (participanteId: string) => {
    const current = participantes.find(p => p.id === participanteId)?.pagado;
    const { error } = await supabase.from("participantes").update({ pagado: !current }).eq("id", participanteId);
    if (!error) setParticipantes(prev => prev.map(p => p.id === participanteId ? { ...p, pagado: !p.pagado } : p));
  };

  const handleEliminar = async (participanteId: string) => {
    const { error } = await supabase.from("participantes").delete().eq("id", participanteId);
    if (!error) { setParticipantes(prev => prev.filter(p => p.id !== participanteId)); setConfirmDelete(null); }
  };

  const loadPredicciones = async (participanteId: string) => {
    if (expandedParticipante === participanteId) { setExpandedParticipante(null); return; }
    setExpandedParticipante(participanteId);
    if (prediccionesDetalle[participanteId]) return;
    setLoadingPreds(participanteId);
    const { data } = await supabase.from("predicciones_grupos").select("partido_id, prediccion").eq("participante_id", participanteId);
    if (data) setPrediccionesDetalle(prev => ({ ...prev, [participanteId]: data }));
    setLoadingPreds(null);
  };

  const tabs = [
    { key: "resultados", label: "Resultados", icon: Check },
    { key: "participantes", label: "Participantes", icon: Users },
    { key: "eliminatorias", label: "Eliminatorias", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/[0.04] rounded-full blur-3xl" />
      </div>

      <header className="border-b border-stone-900 bg-stone-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 text-stone-500 hover:text-stone-300 transition"><ArrowLeft size={16} /></Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-amber-600 rounded-xl flex items-center justify-center">
                <Trophy size={18} className="text-stone-900" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-black text-base leading-none text-stone-100">
                  QUINIELA<span className="text-amber-400">26</span>
                  <span className="ml-2 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded font-bold tracking-wider">ADMIN</span>
                </div>
                <div className="text-[9px] text-stone-500 tracking-widest">Panel de administración</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg">
              <Check size={12} className="text-emerald-400" />
              <span className="text-xs font-bold text-stone-200">{totalJugados}</span>
              <span className="text-[10px] text-stone-500">jugados</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg">
              <DollarSign size={12} className="text-amber-400" />
              <span className="text-xs font-bold text-stone-200">{totalPagados}/{participantes.length}</span>
              <span className="text-[10px] text-stone-500">pagados</span>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 border-t border-stone-900">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as typeof tab)}
              className={`relative px-4 py-2.5 font-bold text-xs tracking-wide flex items-center gap-1.5 transition-colors ${tab === key ? "text-stone-100" : "text-stone-500 hover:text-stone-300"}`}>
              <Icon size={13} />{label}
              {tab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { val: participantes.length, label: "Participantes", icon: Users, color: "text-amber-400" },
            { val: totalPagados, label: "Pagados", icon: DollarSign, color: "text-emerald-400" },
            { val: totalJugados, label: "Jugados", icon: Check, color: "text-blue-400" },
            { val: totalPendientes, label: "Pendientes", icon: Clock, color: "text-stone-300" },
          ].map(({ val, label, icon: Icon, color }) => (
            <div key={label} className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${color}`}>{val}</div>
              <div className="text-xs text-stone-400 mt-1 flex items-center justify-center gap-1"><Icon size={11} />{label}</div>
            </div>
          ))}
        </div>

        {tab === "resultados" && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
                {grupos.map(g => (
                  <button key={g} onClick={() => setFilterGrupo(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border transition-all ${filterGrupo === g ? "bg-amber-400 text-stone-900 border-transparent" : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"}`}>
                    {g === "ALL" ? "Todos" : `Grupo ${g}`}
                  </button>
                ))}
              </div>
              <button onClick={() => setFilterPendiente(!filterPendiente)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-shrink-0 ${filterPendiente ? "bg-amber-400/20 text-amber-300 border-amber-700/40" : "bg-stone-900/60 text-stone-400 border-stone-800"}`}>
                Solo pendientes
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {partidosFiltrados.map(partido => {
                const home = TEAMS[partido.equipo_local];
                const away = TEAMS[partido.equipo_visitante];
                const fecha = new Date(partido.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
                return (
                  <div key={partido.id} className={`bg-stone-900/40 border rounded-2xl p-4 ${partido.resultado ? "border-emerald-800/30" : "border-stone-800/60"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] text-stone-500 flex items-center gap-2">
                        <span className="font-bold text-stone-400">Grupo {partido.grupo}</span><span>·</span><span>{fecha}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {saving === partido.id && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
                        {partido.resultado && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400">✓ Cargado</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
                      <div className="text-right"><div className="text-xl mb-0.5">{home?.flag}</div><div className="font-bold text-xs text-stone-100">{home?.name}</div></div>
                      <div className="text-stone-700 font-mono text-xs">vs</div>
                      <div className="text-left"><div className="text-xl mb-0.5">{away?.flag}</div><div className="font-bold text-xs text-stone-100">{away?.name}</div></div>
                    </div>
                    <div className="flex gap-1.5">
                      {[{ val: "1", label: `Gana ${partido.equipo_local}` }, { val: "X", label: "Empate" }, { val: "2", label: `Gana ${partido.equipo_visitante}` }].map(({ val, label }) => (
                        <button key={val} onClick={() => handleResultado(partido.id, val)} disabled={saving === partido.id}
                          className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border ${partido.resultado === val ? "bg-emerald-400 text-stone-900 border-transparent shadow-md" : "bg-stone-950/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {partido.estadio && <div className="text-[10px] text-stone-600 mt-2 text-center truncate">{partido.estadio}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "participantes" && (
          <div className="space-y-3">
            {participantes.length === 0 && (
              <div className="text-center py-16 text-stone-500">
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay participantes registrados aún.</p>
              </div>
            )}
            {participantes.map((p, idx) => {
              const isExpanded = expandedParticipante === p.id;
              return (
                <div key={p.id} className="bg-stone-900/40 border border-stone-800/60 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center font-black text-xs text-stone-400 flex-shrink-0">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-stone-100">{p.nombre}</div>
                      <div className="text-xs text-stone-500 truncate">{p.email}</div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] text-stone-400"><span className="font-bold text-emerald-400">{p.aciertos_total}</span> aciertos</span>
                        {p.goleador_pick && <span className="text-[10px] text-stone-400">⚽ <span className="text-amber-300">{p.goleador_pick}</span></span>}
                      </div>
                    </div>
                    <button onClick={() => togglePagado(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all flex-shrink-0 ${p.pagado ? "bg-emerald-400/20 border-emerald-700/40 text-emerald-300" : "bg-stone-950/60 border-stone-800 text-stone-500 hover:border-stone-700"}`}>
                      <DollarSign size={12} />{p.pagado ? "Pagó" : "Pendiente"}
                    </button>
                    <button onClick={() => loadPredicciones(p.id)} className="p-2 text-stone-500 hover:text-amber-400 transition flex-shrink-0">
                      {loadingPreds === p.id ? <div className="w-4 h-4 border border-amber-400 border-t-transparent rounded-full animate-spin" /> : isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                    </button>
                    {confirmDelete === p.id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => handleEliminar(p.id)} className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500 transition">Confirmar</button>
                        <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 bg-stone-800 text-stone-300 rounded-lg text-xs font-bold hover:bg-stone-700 transition">Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(p.id)} className="p-2 text-stone-600 hover:text-red-400 transition flex-shrink-0"><Trash2 size={15} /></button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-stone-800/60 px-4 py-3 bg-stone-950/40">
                      <div className="text-[10px] font-bold tracking-widest text-stone-500 uppercase mb-2">Predicciones de fase de grupos</div>
                      {prediccionesDetalle[p.id]?.length === 0 ? (
                        <p className="text-xs text-stone-500">No ha llenado predicciones aún.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                          {prediccionesDetalle[p.id]?.map(pred => {
                            const partido = partidos.find(pa => pa.id === pred.partido_id);
                            if (!partido) return null;
                            const esAcierto = partido.resultado && partido.resultado === pred.prediccion;
                            const esFallo = partido.resultado && partido.resultado !== pred.prediccion;
                            return (
                              <div key={pred.partido_id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${esAcierto ? "bg-emerald-950/40 border-emerald-800/40" : esFallo ? "bg-red-950/30 border-red-900/40" : "bg-stone-900/40 border-stone-800/40"}`}>
                                <span className="text-stone-400 font-mono text-[10px]">{pred.partido_id}</span>
                                <span className="flex-1 text-stone-300 truncate">
                                  {pred.prediccion === "1" ? TEAMS[partido.equipo_local]?.name : pred.prediccion === "2" ? TEAMS[partido.equipo_visitante]?.name : "Empate"}
                                </span>
                                {esAcierto && <span className="text-emerald-400">✓</span>}
                                {esFallo && <span className="text-red-400">✗</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "eliminatorias" && (
          <div>
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 mb-5">
              <p className="text-xs text-stone-300 leading-relaxed">
                <span className="font-bold text-amber-300">Para cada llave:</span> primero define los equipos (botón ✏️), luego cuando se juegue el partido marca quién pasó.
              </p>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5">
              {RONDAS.map(r => (
                <button key={r} onClick={() => setActiveRonda(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border transition-all ${activeRonda === r ? "bg-amber-400 text-stone-900 border-transparent" : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"}`}>
                  {r === "16vos" ? "16vos" : r === "8vos" ? "Octavos" : r === "4tos" ? "Cuartos" : r === "semi" ? "Semis" : "Final"}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {llavesRonda.map(llave => {
                const definida = !!(llave.equipo_local && llave.equipo_visitante);
                const isEditing = editingLlave === llave.id;
                const localTeam = llave.equipo_local ? TEAMS[llave.equipo_local] : null;
                const visitanteTeam = llave.equipo_visitante ? TEAMS[llave.equipo_visitante] : null;
                const fecha = new Date(llave.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
                return (
                  <div key={llave.id} className={`bg-stone-900/40 border rounded-2xl p-4 ${llave.ganador ? "border-emerald-800/30" : definida ? "border-stone-800/60" : "border-stone-800/30"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] text-stone-500 flex items-center gap-2">
                        <span className="font-bold text-purple-400">{llave.id}</span>
                        <span>·</span><span>{fecha}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {saving === llave.id && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
                        {llave.ganador && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400">✓ {TEAMS[llave.ganador]?.name || llave.ganador}</span>}
                        <button onClick={() => { setEditingLlave(isEditing ? null : llave.id); setLlaveLocal(llave.equipo_local || ""); setLlaveVisitante(llave.equipo_visitante || ""); }}
                          className="text-[10px] px-2 py-1 bg-stone-800 text-stone-300 rounded-lg hover:bg-stone-700 transition font-bold">
                          {isEditing ? "Cancelar" : definida ? "✏️ Editar" : "✏️ Definir"}
                        </button>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <div className="text-[10px] text-stone-500 mb-1 uppercase tracking-wider">Equipo local</div>
                          <select value={llaveLocal} onChange={e => setLlaveLocal(e.target.value)}
                            className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500/60">
                            <option value="">Selecciona...</option>
                            {TEAM_OPTIONS.map(t => <option key={t.code} value={t.code}>{t.flag} {t.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="text-[10px] text-stone-500 mb-1 uppercase tracking-wider">Equipo visitante</div>
                          <select value={llaveVisitante} onChange={e => setLlaveVisitante(e.target.value)}
                            className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500/60">
                            <option value="">Selecciona...</option>
                            {TEAM_OPTIONS.map(t => <option key={t.code} value={t.code}>{t.flag} {t.name}</option>)}
                          </select>
                        </div>
                        <button onClick={() => handleDefinirLlave(llave.id)} disabled={!llaveLocal || !llaveVisitante || saving === llave.id}
                          className="w-full py-2 bg-amber-400 text-stone-900 rounded-lg font-bold text-xs hover:bg-amber-300 transition disabled:opacity-50">
                          Guardar equipos
                        </button>
                      </div>
                    ) : definida ? (
                      <>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
                          <div className="text-right"><div className="text-xl mb-0.5">{localTeam?.flag}</div><div className="font-bold text-xs text-stone-100">{localTeam?.name}</div></div>
                          <div className="text-stone-700 font-mono text-xs">vs</div>
                          <div className="text-left"><div className="text-xl mb-0.5">{visitanteTeam?.flag}</div><div className="font-bold text-xs text-stone-100">{visitanteTeam?.name}</div></div>
                        </div>
                        <div className="flex gap-1.5">
                          {[{ val: llave.equipo_local!, team: localTeam }, { val: llave.equipo_visitante!, team: visitanteTeam }].map(({ val, team }) => (
                            <button key={val} onClick={() => handleGanadorLlave(llave.id, val)} disabled={saving === llave.id}
                              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border ${llave.ganador === val ? "bg-emerald-400 text-stone-900 border-transparent shadow-md" : "bg-stone-950/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200"}`}>
                              Pasa {team?.name || val}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-3 text-center">
                        <div className="text-xs text-stone-500 font-mono">{llave.placeholder_local} vs {llave.placeholder_visitante}</div>
                        <div className="text-[10px] text-stone-600 mt-1">Usa ✏️ Definir cuando se conozcan los equipos</div>
                      </div>
                    )}
                    {llave.estadio && <div className="text-[10px] text-stone-600 mt-2 text-center truncate">{llave.estadio}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
