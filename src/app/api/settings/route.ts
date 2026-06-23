import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/data";
import { normalizeConfig } from "@/lib/scoring-config";
import { settingsBodySchema, parseBody } from "@/lib/validation";

/** GET /api/settings — the current user's saved settings (scoring config, …). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const record = await prisma.user.findUnique({ where: { id: user.id } });
    return NextResponse.json(record?.settings ?? {});
  } catch (err) {
    console.error("[/api/settings GET]", err);
    return NextResponse.json({}, { status: 200 });
  }
}

/** PATCH /api/settings — merge new settings (e.g. scoringConfig) for the user. */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = await parseBody(req, settingsBodySchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data as Record<string, unknown>;

  // Normalize scoringConfig (fills any defaults) if present.
  if (body.scoringConfig) {
    body.scoringConfig = normalizeConfig(
      body.scoringConfig as Record<string, number>
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: user.id } });
    const merged = {
      ...(existing?.settings as Record<string, unknown> | null ?? {}),
      ...body,
    };
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { settings: merged as Prisma.InputJsonValue },
    });
    return NextResponse.json(updated.settings);
  } catch (err) {
    console.error("[/api/settings PATCH]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}
