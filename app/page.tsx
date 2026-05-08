import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuinielaApp from "@/components/QuinielaApp";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: participante } = await supabase
    .from("participantes")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: partidos } = await supabase
    .from("partidos")
    .select("*")
    .order("fecha", { ascending: true });

  const { data: predicciones } = await supabase
    .from("predicciones_grupos")
    .select("*")
    .eq("participante_id", user.id);

  const { data: posiciones } = await supabase
    .from("tabla_posiciones")
    .select("*");

  const { data: goleadores } = await supabase
    .from("goleadores_candidatos")
    .select("*");

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .single();

  const { data: llaves } = await supabase
    .from("llaves_eliminatorias")
    .select("*")
    .order("fecha", { ascending: true });

  const { data: prediccionesElim } = await supabase
    .from("predicciones_eliminatorias")
    .select("*")
    .eq("participante_id", user.id);

  return (
    <QuinielaApp
      participante={participante}
      partidos={partidos || []}
      prediccionesIniciales={predicciones || []}
      posiciones={posiciones || []}
      goleadores={goleadores || []}
      deadline={deadlines?.fase_grupos}
      deadlineElim={deadlines?.fase_eliminatorias}
      llaves={llaves || []}
      prediccionesElimIniciales={prediccionesElim || []}
    />
  );
}
