import { NextResponse } from "next/server";
import { getAccount, saveAccount, findByEmail } from "../../../lib/store.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");
  let account = null;
  if (id) account = await getAccount(id);
  else if (email) account = await findByEmail(email);
  if (!account) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ account });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const business = body.business || {};
  if (!business.name || !business.phone) {
    return NextResponse.json(
      { error: "missing_fields", message: "Business name and phone are required." },
      { status: 400 }
    );
  }
  const account = await saveAccount({
    id: body.id,
    email: body.email || "",
    business,
    economics: body.economics || {},
    connections: body.connections || {},
    preferences: body.preferences || {
      requireApprovalForSpend: true,
      requireApprovalForCustomerFacing: true,
    },
  });
  return NextResponse.json({ account });
}
