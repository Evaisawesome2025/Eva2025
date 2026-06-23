import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/data";
import { savedDealStatusSchema, parseBody } from "@/lib/validation";

/** PATCH /api/saved-deals/[id] — update a saved deal's pipeline status. */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = await parseBody(req, savedDealStatusSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const result = await prisma.savedDeal.updateMany({
      where: { id: params.id, userId: user.id },
      data: { status: body.status },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ id: params.id, status: body.status });
  } catch (err) {
    console.error("[/api/saved-deals]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}

/** DELETE /api/saved-deals/[id] — stop tracking a deal. */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    await prisma.savedDeal.deleteMany({
      where: { id: params.id, userId: user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/saved-deals delete]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}
