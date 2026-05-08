import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEAM_MAP: Record<number, string> = {
  1: "MEX",
  494: "RSA",
  732: "KOR",
  24: "CZE",
  6: "BRA",
  195: "MAR",
  514: "HAI",
  1181: "SCO",
  21: "USA",
  775: "PAR",
  25: "AUS",
  737: "SWE",
  773: "GER",
  1631: "CUW",
  492: "CIV",
  730: "ECU",
  5: "NED",
  827: "JPN",
  791: "TUR",
  202: "TUN",
  9: "BEL",
  34: "EGY",
  796: "IRN",
  1186: "NZL",
  29: "ESP",
  940: "CPV",
  786: "KSA",
  868: "URU",
  2: "FRA",
  608: "SEN",
  1569: "COD",
  1118: "NOR",
  26: "ARG",
  1050: "ALG",
  776: "AUT",
  801: "JOR",
  27: "POR",
  2417: "UZB",
  826: "COL",
  1567: "IRQ",
  10: "ENG",
  762: "CRO",
  811: "GHA",
  780: "PAN",
  3: "CAN",
  1527: "BIH",
  788: "QAT",
  15: "SUI",
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?league=1&season=2026",
      {
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY!,
        },
      }
    );

    const data = await response.json();
    const fixtures = data.response;

    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({ message: "No fixtures found" });
    }

    let updated = 0;

    for (const fixture of fixtures) {
      const status = fixture.fixture.status.short;
      if (status !== "FT" && status !== "AET" && status !== "PEN") continue;

      const homeGoals = fixture.goals.home;
      const awayGoals = fixture.goals.away;

      let resultado: string;
      if (homeGoals > awayGoals) resultado = "1";
      else if (homeGoals === awayGoals) resultado = "X";
      else resultado = "2";

      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;
      const homeCode = TEAM_MAP[homeId];
      const awayCode = TEAM_MAP[awayId];

      if (!homeCode || !awayCode) continue;

      const { error } = await supabase
        .from("partidos")
        .update({ resultado, updated_at: new Date().toISOString() })
        .eq("equipo_local", homeCode)
        .eq("equipo_visitante", awayCode)
        .is("resultado", null);

      if (!error) updated++;
    }

    return NextResponse.json({ message: `Updated ${updated} matches` });
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
