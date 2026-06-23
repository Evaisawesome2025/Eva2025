import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/data";
import { shareBodySchema, parseBody } from "@/lib/validation";

/** POST /api/share — enable (or return) a public read-only link for a deal. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = await parseBody(req, shareBodySchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const deal = await prisma.savedDeal.findFirst({
      where: { id: parsed.data.dealId, userId: user.id },
    });
    if (!deal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const token = deal.shareToken ?? randomBytes(16).toString("hex");
    if (!deal.shareToken) {
      await prisma.savedDeal.update({
        where: { id: deal.id },
        data: { shareToken: token },
      });
    }
    return NextResponse.json({ token });
  } catch (err) {
    console.error("[/api/share POST]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}

/** DELETE /api/share?dealId= — revoke the public link. */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const dealId = new URL(req.url).searchParams.get("dealId");
  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }
  try {
    await prisma.savedDeal.updateMany({
      where: { id: dealId, userId: user.id },
      data: { shareToken: null },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/share DELETE]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}
