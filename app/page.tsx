import { createClient } from "@/lib/supabase/server";
import { Trophy, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: participante } = await supabase
    .from("participantes")
    .select("nombre, email, es_admin")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 rounded-2xl mb-6 shadow-lg shadow-amber-900/40">
          <Trophy size={28} className="text-stone-900" strokeWidth={2.5} />
        </div>

        <h1 className="text-3xl font-black text-stone-100 mb-2">
          ¡Hola, {participante?.nombre || "jugador"}!
        </h1>
        <p className="text-stone-400 mb-2">
          Tu cuenta está lista 🎉
        </p>
        <p className="text-xs text-stone-500 mb-8">
          {participante?.email}
          {participante?.es_admin && (
            <span className="ml-2 bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">ADMIN</span>
          )}
        </p>

        <div className="bg-stone-900/40 backdrop-blur border border-stone-800 rounded-2xl p-5 mb-6 text-left">
          <p className="text-sm text-stone-300 mb-2">
            <span className="font-bold text-amber-400">Setup completo.</span> El login funciona correctamente.
          </p>
          <p className="text-xs text-stone-500">
            Las pantallas de la quiniela (predicciones, eliminatorias, posiciones) llegan en el siguiente paquete.
          </p>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-xs text-stone-500 hover:text-stone-300 inline-flex items-center gap-1.5 transition"
          >
            <LogOut size={12} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
