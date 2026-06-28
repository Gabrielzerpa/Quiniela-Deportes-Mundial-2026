"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Lock } from "lucide-react";

type Partido = {
  id: string; grupo: string; jornada: number;
  equipo_local: string; equipo_visitante: string; resultado: string | null;
};
type Participante = {
  id: string; nombre: string;
};
type Prediccion = {
  participante_id: string; partido_id: string; prediccion: string;
};
type PrediccionElim = {
  participante_id: string; llave_id: string; equipo_pick: string;
};
type Llave = {
  id: string; ronda: string; fecha: string;
  equipo_local: string | null; equipo_visitante: string | null;
  placeholder_local: string; placeholder_visitante: string;
  ganador: string | null;
};

interface Props {
  partidos: Partido[];
  participantes: Participante[];
  esAdmin: boolean;
  deadlineGrupos: string;
  deadlineElim: string;
  llaves: Llave[];
}

const TEAMS: Record<string, string> = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿",
  CAN: "🇨🇦", BIH: "🇧🇦", QAT: "🇶🇦", SUI: "🇨🇭",
  BRA: "🇧🇷", MAR: "🇲🇦", HAI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA: "🇺🇸", PAR: "🇵🇾", AUS: "🇦🇺", SWE: "🇸🇪",
  GER: "🇩🇪", CUW: "🇨🇼", CIV: "🇨🇮", ECU: "🇪🇨",
  NED: "🇳🇱", JPN: "🇯🇵", TUR: "🇹🇷", TUN: "🇹🇳",
  BEL: "🇧🇪", EGY: "🇪🇬", IRN: "🇮🇷", NZL: "🇳🇿",
  ESP: "🇪🇸", CPV: "🇨🇻", KSA: "🇸🇦", URU: "🇺🇾",
  FRA: "🇫🇷", SEN: "🇸🇳", COD: "🇨🇩", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴",
  POR: "🇵🇹", UZB: "🇺🇿", COL: "🇨🇴", IRQ: "🇮🇶",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦",
  POL: "🇵🇱", NGA: "🇳🇬",
};

const TEAM_NAMES: Record<string, string> = {
  MEX: "México", RSA: "Sudáfrica", KOR: "Corea del Sur", CZE: "Rep. Checa",
  CAN: "Canadá", BIH: "Bosnia y Herz.", QAT: "Qatar", SUI: "Suiza",
  BRA: "Brasil", MAR: "Marruecos", HAI: "Haití", SCO: "Escocia",
  USA: "EE.UU.", PAR: "Paraguay", AUS: "Australia", SWE: "Suecia",
  GER: "Alemania", CUW: "Curazao", CIV: "C. de Marfil", ECU: "Ecuador",
  NED: "P. Bajos", JPN: "Japón", TUR: "Turquía", TUN: "Túnez",
  BEL: "Bélgica", EGY: "Egipto", IRN: "Irán", NZL: "Nueva Zelanda",
  ESP: "España", CPV: "Cabo Verde", KSA: "Arabia Saudita", URU: "Uruguay",
  FRA: "Francia", SEN: "Senegal", COD: "RD Congo", NOR: "Noruega",
  ARG: "Argentina", ALG: "Argelia", AUT: "Austria", JOR: "Jordania",
  POR: "Portugal", UZB: "Uzbekistán", COL: "Colombia", IRQ: "Iraq",
  ENG: "Inglaterra", CRO: "Croacia", GHA: "Ghana", PAN: "Panamá",
  POL: "Polonia", NGA: "Nigeria",
};

const RONDAS_ORDER = ["16vos", "8vos", "4tos", "semi", "final"];
const RONDAS_LABEL: Record<string, string> = {
  "16vos": "16vos de Final",
  "8vos": "Octavos",
  "4tos": "Cuartos",
  "semi": "Semifinales",
  "final": "Final",
};

export default function TablaPredicciones({ partidos, participantes, esAdmin, deadlineGrupos, deadlineElim, llaves }: Props) {
  const [tabVista, setTabVista] = useState<"grupos" | "eliminatorias">("grupos");
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [prediccionesElim, setPrediccionesElim] = useState<PrediccionElim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrupo, setFilterGrupo] = useState("ALL");
  const [prediccionesVisibles, setPrediccionesVisibles] = useState(false);
  const supabase = createClient();

  const ahora = new Date();
  const deadlineGruposPasado = ahora >= new Date(deadlineGrupos);
  const deadlineElimPasado = ahora >= new Date(deadlineElim);
  const puedeVerTabla = esAdmin || deadlineGruposPasado || prediccionesVisibles;
  const puedeVerElim = esAdmin || deadlineElimPasado;

  useEffect(() => {
    const fetchVisibilidad = async () => {
      const { data } = await supabase.from("deadlines").select("predicciones_visibles").single();
      if (data) setPrediccionesVisibles(data.predicciones_visibles || false);
    };
    fetchVisibilidad();
  }, []);

  useEffect(() => {
    if (!puedeVerTabla) { setLoading(false); return; }
    const fetchPredicciones = async () => {
      setLoading(true);
      let todas: Prediccion[] = [];
      let desde = 0;
      const tamano = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("predicciones_grupos")
          .select("participante_id, partido_id, prediccion")
          .range(desde, desde + tamano - 1);
        if (error || !data || data.length === 0) break;
        todas = todas.concat(data);
        if (data.length < tamano) break;
        desde += tamano;
      }
      setPredicciones(todas);
      setLoading(false);
    };
    fetchPredicciones();
  }, [puedeVerTabla, prediccionesVisibles]);

  useEffect(() => {
    if (!puedeVerElim) return;
    const fetchElim = async () => {
      const { data } = await supabase
        .from("predicciones_eliminatorias")
        .select("participante_id, llave_id, equipo_pick");
      if (data) setPrediccionesElim(data);
    };
    fetchElim();
  }, [puedeVerElim]);

  const grupos = ["ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const partidosFiltrados = filterGrupo === "ALL"
    ? partidos
    : partidos.filter(p => p.grupo === filterGrupo);

  const llavesOrdenadas = RONDAS_ORDER.flatMap(ronda =>
    llaves.filter(l => l.ronda === ronda).sort((a, b) => a.id.localeCompare(b.id))
  );

  const getPred = (participanteId: string, partidoId: string) =>
    predicciones.find(p => p.participante_id === participanteId && p.partido_id === partidoId)?.prediccion;

  const getPredElim = (participanteId: string, llaveId: string) =>
    prediccionesElim.find(p => p.participante_id === participanteId && p.llave_id === llaveId)?.equipo_pick;

  const getPredLabel = (pred: string | undefined, partido: Partido) => {
    if (!pred) return "—";
    if (pred === "1") return partido.equipo_local;
    if (pred === "2") return partido.equipo_visitante;
    return "X";
  };

  const getPredColor = (pred: string | undefined, partido: Partido) => {
    if (!pred || !partido.resultado) return "";
    if (pred === partido.resultado) return "bg-emerald-400/20 text-emerald-400";
    return "bg-red-950/30 text-red-400";
  };

  const getPredElimColor = (pick: string | undefined, llave: Llave) => {
    if (!pick || !llave.ganador) return "";
    if (pick === llave.ganador) return "bg-emerald-400/20 text-emerald-400";
    return "bg-red-950/30 text-red-400";
  };

  const downloadCSVGrupos = () => {
    const headers = ["Participante", ...partidosFiltrados.map(p => `${p.equipo_local}vs${p.equipo_visitante}`)];
    const rows = participantes.map(part => {
      const preds = partidosFiltrados.map(partido => {
        const pred = getPred(part.id, partido.id);
        return getPredLabel(pred, partido);
      });
      return [part.nombre, ...preds];
    });
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `predicciones-grupos-${filterGrupo === "ALL" ? "todos" : `grupo-${filterGrupo}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSVElim = () => {
    const headers = ["Participante", ...llavesOrdenadas.map(l => `${l.id} (${l.ronda})`)];
    const rows = participantes.map(part => {
      const preds = llavesOrdenadas.map(llave => {
        const pick = getPredElim(part.id, llave.id);
        return pick ? (TEAM_NAMES[pick] || pick) : "—";
      });
      return [part.nombre, ...preds];
    });
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predicciones-eliminatorias.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-stone-500">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando...</p>
      </div>
    );
  }

  if (!puedeVerTabla) {
    return (
      <div className="text-center py-16 text-stone-500">
        <Lock size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold text-stone-400 mb-1">Tabla disponible tras el pitazo inicial</p>
        <p className="text-xs">Las predicciones de todos se revelan cuando comience el Mundial.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-stone-100">Tabla de predicciones</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {esAdmin && !deadlineGruposPasado && !prediccionesVisibles && (
              <span className="text-amber-400">Solo visible para admins · </span>
            )}
            {tabVista === "grupos" ? "Fase de grupos" : "Fase eliminatoria"}
          </p>
        </div>
        <button onClick={tabVista === "grupos" ? downloadCSVGrupos : downloadCSVElim}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition">
          <Download size={14} />
          Descargar CSV
        </button>
      </div>

      {/* Tabs Grupos / Eliminatorias */}
      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setTabVista("grupos")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            tabVista === "grupos" ? "bg-amber-400 text-stone-900 border-transparent" : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"
          }`}>
          Fase de grupos
        </button>
        <button onClick={() => setTabVista("eliminatorias")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            tabVista === "eliminatorias" ? "bg-amber-400 text-stone-900 border-transparent" : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"
          }`}>
          Eliminatorias
        </button>
      </div>

      {tabVista === "grupos" && (
        <>
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

          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-900/80 border-b border-stone-800">
                  <td className="px-3 py-2.5 font-bold text-stone-300 sticky left-0 bg-stone-900 z-10 min-w-[120px]">
                    Participante
                  </td>
                  {partidosFiltrados.map(partido => (
                    <td key={partido.id} className="px-2 py-2 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <span>{TEAMS[partido.equipo_local] || "🏳️"}</span>
                          <span className="text-stone-600 font-mono">vs</span>
                          <span>{TEAMS[partido.equipo_visitante] || "🏳️"}</span>
                        </div>
                        <div className="text-[9px] text-stone-600 font-mono">G{partido.grupo}</div>
                        {partido.resultado && (
                          <div className="text-[9px] font-bold text-amber-400">
                            {partido.resultado === "1" ? partido.equipo_local : partido.resultado === "2" ? partido.equipo_visitante : "X"}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participantes.map((part, idx) => (
                  <tr key={part.id} className={`border-b border-stone-900 ${idx % 2 === 0 ? "bg-stone-950/40" : "bg-stone-900/20"}`}>
                    <td className={`px-3 py-2 font-bold text-stone-200 sticky left-0 z-10 ${idx % 2 === 0 ? "bg-stone-950" : "bg-stone-900"}`}>
                      {part.nombre}
                    </td>
                    {partidosFiltrados.map(partido => {
                      const pred = getPred(part.id, partido.id);
                      const label = getPredLabel(pred, partido);
                      const color = getPredColor(pred, partido);
                      return (
                        <td key={partido.id} className="px-2 py-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${color || "text-stone-500"}`}>
                            {label === "X" ? "Emp" : label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center gap-4 text-[10px] text-stone-500">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-emerald-400/20" />Acierto</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-red-950/30" />Fallo</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-stone-800" />Sin resultado aún</div>
          </div>
        </>
      )}

      {tabVista === "eliminatorias" && (
        <>
          {!puedeVerElim ? (
            <div className="text-center py-16 text-stone-500">
              <Lock size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold text-stone-400 mb-1">Disponible tras el cierre de eliminatorias</p>
              <p className="text-xs">Las predicciones se revelan cuando cierre el plazo.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-stone-900/80 border-b border-stone-800">
                      <td className="px-3 py-2.5 font-bold text-stone-300 sticky left-0 bg-stone-900 z-10 min-w-[120px]">
                        Participante
                      </td>
                      {llavesOrdenadas.map(llave => (
                        <td key={llave.id} className="px-2 py-2 text-center min-w-[90px]">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1">
                              <span>{llave.equipo_local ? (TEAMS[llave.equipo_local] || "🏳️") : "?"}</span>
                              <span className="text-stone-600 font-mono">vs</span>
                              <span>{llave.equipo_visitante ? (TEAMS[llave.equipo_visitante] || "🏳️") : "?"}</span>
                            </div>
                            <div className="text-[9px] text-purple-400 font-mono">{llave.id}</div>
                            <div className="text-[9px] text-stone-600">{RONDAS_LABEL[llave.ronda]}</div>
                            {llave.ganador && (
                              <div className="text-[9px] font-bold text-amber-400">
                                {TEAMS[llave.ganador] || llave.ganador}
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participantes.map((part, idx) => (
                      <tr key={part.id} className={`border-b border-stone-900 ${idx % 2 === 0 ? "bg-stone-950/40" : "bg-stone-900/20"}`}>
                        <td className={`px-3 py-2 font-bold text-stone-200 sticky left-0 z-10 ${idx % 2 === 0 ? "bg-stone-950" : "bg-stone-900"}`}>
                          {part.nombre}
                        </td>
                        {llavesOrdenadas.map(llave => {
                          const pick = getPredElim(part.id, llave.id);
                          const color = getPredElimColor(pick, llave);
                          return (
                            <td key={llave.id} className="px-2 py-2 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${color || "text-stone-500"}`}>
                                {pick ? (TEAMS[pick] || pick) : "—"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center gap-4 text-[10px] text-stone-500">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-emerald-400/20" />Acierto</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-red-950/30" />Fallo</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-stone-800" />Sin resultado aún</div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
