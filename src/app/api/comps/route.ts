import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/data";
import { getComparables } from "@/services/rentcastService";

/**
 * POST /api/comps — fetch comparable sales from an approved provider
 * (RentCast) and persist them against the property. Returns the stored comps.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { propertyId?: string; address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.propertyId || !body.address) {
    return NextResponse.json(
      { error: "propertyId and address are required" },
      { status: 400 }
    );
  }

  try {
    const property = await prisma.property.findFirst({
      where: { id: body.propertyId, userId: user.id },
    });
    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const comps = await getComparables(body.address);
    if (comps.length === 0) {
      return NextResponse.json({
        comps: [],
        message:
          "No comps returned. Add RENTCAST_API_KEY (or another approved provider) to enable.",
      });
    }

    // Replace prior comps for this property with the fresh pull.
    await prisma.comparableSale.deleteMany({
      where: { propertyId: property.id, source: "rentcast" },
    });
    await prisma.comparableSale.createMany({
      data: comps.map((c) => ({
        propertyId: property.id,
        formattedAddress: c.formattedAddress,
        salePrice: c.salePrice,
        saleDate: c.saleDate ? new Date(c.saleDate) : null,
        beds: c.beds,
        baths: c.baths,
        sqft: c.sqft,
        pricePerSqft:
          c.salePrice && c.sqft ? Math.round(c.salePrice / c.sqft) : null,
        distanceMiles: c.distanceMiles,
        source: "rentcast",
      })),
    });

    return NextResponse.json({ comps });
  } catch (err) {
    console.error("[/api/comps]", err);
    return NextResponse.json(
      { error: "Unable to fetch comps. Check provider configuration." },
      { status: 503 }
    );
  }
}
