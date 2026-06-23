import { z } from "zod";

/** Shared request schemas for API route validation. */

export const selectedAddressSchema = z.object({
  formattedAddress: z.string().min(1),
  placeId: z.string().optional().default(""),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  street: z.string().optional(),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  county: z.string().optional().default(""),
});

const finite = z.number().finite();

export const analysisInputsSchema = z.object({
  purchasePrice: finite.default(0),
  estimatedArv: finite.default(0),
  estimatedRepairs: finite.default(0),
  holdingMonths: finite.default(0),
  financingCost: finite.default(0),
  sellingCostPct: finite.default(0),
  closingCostEstimate: finite.default(0),
});

export const analyzeBodySchema = z.object({
  address: selectedAddressSchema,
  inputs: analysisInputsSchema,
});

export const noteBodySchema = z.object({
  propertyId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

export const savedDealStatusSchema = z.object({
  status: z.enum([
    "watching",
    "pursuing",
    "offer_made",
    "under_contract",
    "passed",
  ]),
});

export const compsBodySchema = z.object({
  propertyId: z.string().uuid(),
  address: z.string().min(1),
});

export const scoringConfigSchema = z.object({
  arvMultiplier: z.number().positive().max(2),
  targetRoiPct: z.number().min(0).max(1000),
  targetMarginPct: z.number().min(0).max(1000),
  greenThreshold: z.number().min(0).max(100),
  yellowThreshold: z.number().min(0).max(100),
});

export const settingsBodySchema = z
  .object({
    scoringConfig: scoringConfigSchema.optional(),
  })
  .passthrough();

/**
 * Parse a Request's JSON body against a schema.
 * Returns { data } on success or { error } (a ready-to-return message) on failure.
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      ok: false,
      error: first
        ? `${first.path.join(".")}: ${first.message}`
        : "Invalid input",
    };
  }
  return { ok: true, data: result.data };
}
