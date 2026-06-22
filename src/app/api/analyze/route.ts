import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/data";
import { analyzeDeal } from "@/services/dealScoringService";
import type { AnalysisInputs, SelectedAddress } from "@/lib/types";

/**
 * POST /api/analyze
 * Persists a property + analysis + saved deal for the authenticated user.
 * Recomputes results server-side so stored numbers can't be tampered with.
 */
export async function POST(req: Request) {
  let body: { address?: SelectedAddress; inputs?: AnalysisInputs };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address, inputs } = body;
  if (!address?.formattedAddress || !inputs) {
    return NextResponse.json(
      { error: "address and inputs are required" },
      { status: 400 }
    );
  }

  // Authenticate via Supabase session (gracefully null in demo mode).
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Server-side recompute — never trust client-sent results.
  const result = analyzeDeal(inputs);

  try {
    const property = await prisma.property.upsert({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: address.placeId || address.formattedAddress,
        },
      },
      update: {
        formattedAddress: address.formattedAddress,
        latitude: address.latitude,
        longitude: address.longitude,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        county: address.county,
      },
      create: {
        userId: user.id,
        formattedAddress: address.formattedAddress,
        placeId: address.placeId || address.formattedAddress,
        latitude: address.latitude,
        longitude: address.longitude,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        county: address.county,
      },
    });

    const analysis = await prisma.propertyAnalysis.create({
      data: {
        propertyId: property.id,
        userId: user.id,
        purchasePrice: inputs.purchasePrice,
        estimatedArv: inputs.estimatedArv,
        estimatedRepairs: inputs.estimatedRepairs,
        holdingMonths: inputs.holdingMonths,
        financingCost: inputs.financingCost,
        sellingCostPct: inputs.sellingCostPct,
        closingCostEstimate: inputs.closingCostEstimate,
        maxOffer: result.maxOffer,
        estimatedProfit: result.estimatedProfit,
        flipScore: result.flipScore,
        verdict: result.verdict,
      },
    });

    await prisma.savedDeal.upsert({
      where: {
        userId_propertyId: { userId: user.id, propertyId: property.id },
      },
      update: { analysisId: analysis.id },
      create: {
        userId: user.id,
        propertyId: property.id,
        analysisId: analysis.id,
        status: "watching",
      },
    });

    return NextResponse.json({ propertyId: property.id, analysisId: analysis.id });
  } catch (err) {
    console.error("[/api/analyze] persistence failed:", err);
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL and run db:push." },
      { status: 503 }
    );
  }
}
