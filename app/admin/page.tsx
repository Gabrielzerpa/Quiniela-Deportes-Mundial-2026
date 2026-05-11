import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: participante } = await supabase
    .from("participantes")
    .select("es_admin")
    .eq("id", user.id)
    .single();

  if (!participante?.es_admin) redirect("/");

  const { data: partidos } = await supabase
    .from("partidos")
    .select("*")
    .order("fecha", { ascending: true });

  const { data: posiciones } = await supabase
    .from("tabla_posiciones")
    .select("*");

  const { data: participantesInfo } = await supabase
    .from("participantes")
    .select("id, nombre, email, goleador_pick, pagado, es_admin")
    .eq("activo", true);

  const { data: llaves } = await supabase
    .from("llaves_eliminatorias")
    .select("*")
    .order("fecha", { ascending: true });

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .single();

  const participantes = (posiciones || []).map(p => {
    const info = (participantesInfo || []).find(i => i.id === p.id);
    return info ? {
      ...p,
      email: info.email || "",
      goleador_pick: info.goleador_pick || null,
      pagado: info.pagado || false,
      es_admin: info.es_admin || false,
    } : null;
  }).filter(Boolean);

  const deadlineGrupos = "2026-06-11T16:00:00-06:00";

  return (
    <AdminPanel
      partidos={partidos || []}
      participantes={participantes as any}
      llaves={llaves || []}
      deadlineGrupos={deadlineGrupos}
      prediccionesVisibles={deadlines?.predicciones_visibles || false}
    />
  );
}
