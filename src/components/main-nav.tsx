"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Bookmark,
  Settings,
  Radar,
  LogOut,
  Home,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const authEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze", icon: Calculator },
  { href: "/rental", label: "Rental", icon: Home },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/saved", label: "Saved Deals", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

// The mobile bottom bar shows only the most-used destinations.
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) =>
  ["/", "/analyze", "/compare", "/saved"].includes(i.href)
);

export function MainNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Radar className="size-5 text-primary" />
            <span className="hidden sm:inline">Sioux Falls Flip Radar</span>
            <span className="sm:hidden">Flip Radar</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            {authEnabled && (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
