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

interface Props {
  partidos: Partido[];
  participantes: Participante[];
  esAdmin: boolean;
  deadlineGrupos: string;
  deadlineElim: string;
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

export default function TablaPredicciones({ partidos, participantes, esAdmin, deadlineGrupos, deadlineElim }: Props) {
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrupo, setFilterGrupo] = useState("ALL");
  const supabase = createClient();

  const ahora = new Date();
  const deadlineGruposPasado = ahora >= new Date(deadlineGrupos);
  const deadlineElimPasado = ahora >= new Date(deadlineElim);
  const puedeVerTabla = esAdmin || deadlineGruposPasado;

  useEffect(() => {
    if (!puedeVerTabla) return;
    const fetchPredicciones = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("predicciones_grupos")
        .select("participante_id, partido_id, prediccion");
      setPredicciones(data || []);
      setLoading(false);
    };
    fetchPredicciones();
  }, [puedeVerTabla]);

  const grupos = ["ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const partidosFiltrados = filterGrupo === "ALL"
    ? partidos
    : partidos.filter(p => p.grupo === filterGrupo);

  const getPred = (participanteId: string, partidoId: string) => {
    return predicciones.find(p => p.participante_id === participanteId && p.partido_id === partidoId)?.prediccion;
  };

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

  const downloadExcel = () => {
    // Construir CSV
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
    a.download = `predicciones-mundial-2026-${filterGrupo === "ALL" ? "todos" : `grupo-${filterGrupo}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!puedeVerTabla) {
    return (
      <div className="text-center py-16 text-stone-500">
        <Lock size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold text-stone-400 mb-1">Tabla disponible tras el pitazo inicial</p>
        <p className="text-xs">Las predicciones de todos se revelan cuando comience el Mundial.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-stone-500">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando predicciones...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-stone-100">Tabla de predicciones</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {esAdmin && !deadlineGruposPasado && <span className="text-amber-400">Solo visible para admins hasta el deadline · </span>}
            Fase de grupos
          </p>
        </div>
        <button onClick={downloadExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition">
          <Download size={14} />
          Descargar CSV
        </button>
      </div>

      {/* Filtro por grupo */}
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

      {/* Tabla */}
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
    </div>
  );
}
