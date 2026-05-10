import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.verifyOtp({
      type: type as "email" | "recovery" | "invite" | "email_change" | "magiclink",
      token_hash,
    });
    if (!error && data.user) {
      const { data: participante } = await supabase
        .from("participantes")
        .select("nombre_confirmado")
        .eq("id", data.user.id)
        .single();
      return NextResponse.redirect(`${origin}${participante?.nombre_confirmado ? "/" : "/onboarding"}`);
    }
  }

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: participante } = await supabase
        .from("participantes")
        .select("nombre_confirmado")
        .eq("id", data.user.id)
        .single();
      return NextResponse.redirect(`${origin}${participante?.nombre_confirmado ? "/" : "/onboarding"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
