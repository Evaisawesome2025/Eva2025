import { NextResponse } from "next/server";
import { getAccount } from "../../../lib/store.js";
import { buildPulse, renderPulseEmail } from "../../../lib/pulse.js";

export const dynamic = "force-dynamic";

// GET /api/pulse?id=...            -> the rendered HTML email (the inbox artifact)
// GET /api/pulse?id=...&format=json -> the structured pulse for the in-app view
// Falls back gracefully on hosts without persistence by accepting the account
// via POST (mirrors /api/agent), so the pulse renders from the browser copy.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const format = searchParams.get("format");
  const account = await getAccount(id);
  if (!account) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (format === "json") {
    return NextResponse.json({ pulse: buildPulse(account) });
  }
  return new NextResponse(renderPulseEmail(account), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const account = body.account || (await getAccount(body.id));
  if (!account) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (body.format === "html") {
    return new NextResponse(renderPulseEmail(account), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.json({ pulse: buildPulse(account) });
}
