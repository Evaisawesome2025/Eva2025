import { NextResponse } from "next/server";
import { getAccount } from "../../../lib/store.js";
import { buildInsights } from "../../../lib/insights.js";
import { generateReply } from "../../../lib/agent.js";

export const dynamic = "force-dynamic";

// GET /api/agent?id=...  -> the dashboard's funnel + leads + approvals.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const account = await getAccount(id);
  if (!account) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ insights: buildInsights(account) });
}

// POST /api/agent  { id, message } -> a chat reply from the agent.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const account = await getAccount(body.id);
  if (!account) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { reply, mode } = await generateReply(account, body.message || "");
  return NextResponse.json({ reply, mode });
}
