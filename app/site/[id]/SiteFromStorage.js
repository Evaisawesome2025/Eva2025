"use client";

import { useEffect, useState } from "react";
import BusinessSiteView from "./BusinessSiteView";

// Fallback for hosts without persistent storage (e.g. serverless): render the
// site from the account saved in the owner's browser. Lets the dashboard preview
// and "Open live site" work even when the server has no record.
export default function SiteFromStorage({ id }) {
  const [account, setAccount] = useState(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("flowline_account");
      if (raw) {
        const acc = JSON.parse(raw);
        if (acc && acc.id === id) {
          setAccount(acc);
          return;
        }
      }
    } catch {}
    setAccount(null);
  }, [id]);

  if (account === undefined)
    return (
      <div style={{ textAlign: "center", padding: "120px 20px", fontFamily: "system-ui" }}>
        Loading…
      </div>
    );

  if (!account)
    return (
      <div style={{ textAlign: "center", padding: "120px 20px", fontFamily: "system-ui" }}>
        <h1>Site not found</h1>
        <p style={{ color: "#666", maxWidth: 420, margin: "10px auto" }}>
          This preview opens in the browser where the business was set up. Create or
          open your business in Flowline, then use “Open live site”.
        </p>
        <a href="/onboarding" style={{ color: "#1f6feb", fontWeight: 700 }}>
          Set up a business →
        </a>
      </div>
    );

  return <BusinessSiteView account={account} />;
}
