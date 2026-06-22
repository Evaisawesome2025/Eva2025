import { Badge } from "@/components/ui/badge";
import type { Verdict } from "@/lib/types";

const LABELS: Record<Verdict, string> = {
  green: "Strong Deal",
  yellow: "Proceed With Caution",
  red: "Pass",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <Badge variant={verdict}>{LABELS[verdict]}</Badge>;
}
