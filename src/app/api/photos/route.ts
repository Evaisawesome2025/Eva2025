import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/data";
import { photoBodySchema, parseBody } from "@/lib/validation";

/** GET /api/photos?propertyId= — list a property's photos. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const propertyId = new URL(req.url).searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }
  try {
    const photos = await prisma.propertyPhoto.findMany({
      where: { propertyId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ photos });
  } catch (err) {
    console.error("[/api/photos GET]", err);
    return NextResponse.json({ photos: [] });
  }
}

/** POST /api/photos — record a photo uploaded to Supabase Storage. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = await parseBody(req, photoBodySchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { propertyId, storagePath, caption } = parsed.data;
  try {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId: user.id },
    });
    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const photo = await prisma.propertyPhoto.create({
      data: { propertyId, userId: user.id, storagePath, caption },
    });
    return NextResponse.json(photo);
  } catch (err) {
    console.error("[/api/photos POST]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}

/** DELETE /api/photos?id= — remove a photo record (caller deletes the object). */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  try {
    await prisma.propertyPhoto.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/photos DELETE]", err);
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
}
