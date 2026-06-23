"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Calculator,
  Home,
  GitCompare,
  Bookmark,
  Map as MapIcon,
  Settings,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealSummary } from "@/lib/data";

interface Item {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  group: "Pages" | "Deals";
}

const PAGES: Item[] = [
  { id: "p-dash", label: "Dashboard", href: "/", icon: LayoutDashboard, group: "Pages" },
  { id: "p-analyze", label: "Analyze Property", href: "/analyze", icon: Calculator, group: "Pages" },
  { id: "p-rental", label: "Rental Analysis", href: "/rental", icon: Home, group: "Pages" },
  { id: "p-compare", label: "Compare Deals", href: "/compare", icon: GitCompare, group: "Pages" },
  { id: "p-portfolio", label: "Portfolio Analytics", href: "/portfolio", icon: PieChart, group: "Pages" },
  { id: "p-saved", label: "Saved Deals", href: "/saved", icon: Bookmark, group: "Pages" },
  { id: "p-map", label: "Pipeline Map", href: "/map", icon: MapIcon, group: "Pages" },
  { id: "p-settings", label: "Settings", href: "/settings", icon: Settings, group: "Pages" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [deals, setDeals] = React.useState<DealSummary[]>([]);
  const loaded = React.useRef(false);

  // Global hotkeys + external open trigger.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  // Lazy-load deals the first time the palette opens.
  React.useEffect(() => {
    if (open && !loaded.current) {
      loaded.current = true;
      fetch("/api/deals")
        .then((r) => (r.ok ? r.json() : { deals: [] }))
        .then((data) => setDeals(data.deals ?? []))
        .catch(() => {});
    }
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const items: Item[] = React.useMemo(() => {
    const dealItems: Item[] = deals.map((d) => ({
      id: d.id,
      label: d.formattedAddress,
      sub: `Score ${d.flipScore} · ${d.status.replace("_", " ")}`,
      href: `/properties/${d.id}`,
      group: "Deals",
    }));
    const all = [...PAGES, ...dealItems];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.sub?.toLowerCase().includes(q)
    );
  }, [deals, query]);

  function choose(item: Item | undefined) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(items[active]);
    }
  }

  if (!open) return null;

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search pages and deals…"
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No matches.
            </div>
          )}
          {items.map((item, i) => {
            const showHeader = item.group !== lastGroup;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {showHeader && (
                  <div className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                    {item.group}
                  </div>
                )}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm",
                    active === i ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  {Icon ? (
                    <Icon className="size-4 text-muted-foreground" />
                  ) : (
                    <span className="size-4" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    {item.sub && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.sub}
                      </span>
                    )}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
