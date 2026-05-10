import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: participante } = await supabase
    .from("participantes")
    .select("id, nombre")
    .eq("id", user.id)
    .single();

  if (participante?.nombre && !participante.nombre.includes("@")) {
    redirect("/");
  }

  return <OnboardingForm participanteId={user.id} />;
}
