"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Triggers the browser print dialog (Save as PDF). */
export function PrintButton({
  label = "Print / PDF",
}: {
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="no-print"
      onClick={() => window.print()}
    >
      <Printer />
      {label}
    </Button>
  );
}
