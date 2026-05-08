"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, ArrowLeft, Check, Clock, Users, Target, Trash2, DollarSign, ChevronDown, ChevronUp, Eye } from "lucide-react";
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
  participante: { id: string; nombre: string; email: string; es_admin: boolean; goleador_pick: string | null };
  partidos: Partido[];
  prediccionesIniciales: { partido_id: string; prediccion: string }[];
  posiciones: { id: string; nombre: string; aciertos_grupos: number; aciertos_eliminatorias: number; aciertos_total: number; acerto_goleador: number }[];
  goleadores: { id: string; nombre: string; equipo: string }[];
  deadline: string;
  deadlineElim: string;
  llaves: Llave[];
  prediccionesElimIniciales: { llave_id: string; equipo_pick: string }[];
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
