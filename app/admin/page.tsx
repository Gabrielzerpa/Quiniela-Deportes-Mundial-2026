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

  const { data: participantes } = await supabase
    .from("tabla_posiciones")
    .select("*");

  const { data: llaves } = await supabase
    .from("llaves_eliminatorias")
    .select("*")
    .order("fecha", { ascending: true });

  return (
    <AdminPanel
      partidos={partidos || []}
      participantes={participantes || []}
      llaves={llaves || []}
    />
  );
}
