import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/data";

/** POST /api/notes — add a note to a property the user owns. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { propertyId?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.propertyId || !body.body?.trim()) {
    return NextResponse.json(
      { error: "propertyId and body are required" },
      { status: 400 }
    );
  }

  try {
    // Ownership check before writing.
    const property = await prisma.property.findFirst({
      where: { id: body.propertyId, userId: user.id },
    });
    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        propertyId: body.propertyId,
        body: body.body.trim(),
      },
    });
    return NextResponse.json({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error("[/api/notes]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}
