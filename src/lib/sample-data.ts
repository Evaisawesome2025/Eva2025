import type { Verdict } from "@/lib/types";

/**
 * Sample data used to render the dashboard before a live Supabase/Prisma
 * connection is wired up. Replace these reads with queries against
 * `lib/prisma` or the Supabase client once your database is provisioned.
 */
export interface SampleDeal {
  id: string;
  formattedAddress: string;
  city: string;
  state: string;
  county: string;
  purchasePrice: number;
  estimatedArv: number;
  estimatedRepairs: number;
  maxOffer: number;
  estimatedProfit: number;
  flipScore: number;
  verdict: Verdict;
  status: "watching" | "pursuing" | "offer_made" | "under_contract" | "passed";
  updatedAt: string;
}

export const SAMPLE_DEALS: SampleDeal[] = [
  {
    id: "d1",
    formattedAddress: "1207 S Phillips Ave, Sioux Falls, SD 57105",
    city: "Sioux Falls",
    state: "SD",
    county: "Minnehaha County",
    purchasePrice: 165000,
    estimatedArv: 295000,
    estimatedRepairs: 42000,
    maxOffer: 164500,
    estimatedProfit: 47350,
    flipScore: 78,
    verdict: "green",
    status: "pursuing",
    updatedAt: "2026-06-18",
  },
  {
    id: "d2",
    formattedAddress: "4412 E 6th St, Sioux Falls, SD 57103",
    city: "Sioux Falls",
    state: "SD",
    county: "Minnehaha County",
    purchasePrice: 210000,
    estimatedArv: 285000,
    estimatedRepairs: 35000,
    maxOffer: 164500,
    estimatedProfit: 12200,
    flipScore: 51,
    verdict: "yellow",
    status: "watching",
    updatedAt: "2026-06-15",
  },
  {
    id: "d3",
    formattedAddress: "905 N Western Ave, Sioux Falls, SD 57104",
    city: "Sioux Falls",
    state: "SD",
    county: "Minnehaha County",
    purchasePrice: 240000,
    estimatedArv: 280000,
    estimatedRepairs: 50000,
    maxOffer: 146000,
    estimatedProfit: -28500,
    flipScore: 18,
    verdict: "red",
    status: "passed",
    updatedAt: "2026-06-12",
  },
];

export function getSampleDeal(id: string): SampleDeal | undefined {
  return SAMPLE_DEALS.find((d) => d.id === id);
}
