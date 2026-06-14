import { getAccount } from "../../../lib/store.js";
import BusinessSiteView from "./BusinessSiteView";
import SiteFromStorage from "./SiteFromStorage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const account = await getAccount(params.id);
  if (!account) return { title: "Business site — Flowline" };
  const b = account.business || {};
  return {
    title: `${b.name} — ${b.category || "Home Services"}`,
    description: `Licensed, insured ${(
      b.category || "home services"
    ).toLowerCase()} in ${b.serviceArea || "your area"}. Call ${b.phone || ""}.`,
  };
}

export default async function BusinessSitePage({ params }) {
  // Prefer the persisted account; fall back to the owner's browser storage when
  // the host doesn't persist (serverless).
  const account = await getAccount(params.id);
  if (account) return <BusinessSiteView account={account} />;
  return <SiteFromStorage id={params.id} />;
}
