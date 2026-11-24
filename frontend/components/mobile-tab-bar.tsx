"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Globe2,
  LayoutGrid,
  Scale,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

const TABS: { label: string; href: Route; Icon: LucideIcon }[] = [
  { label: "Home", href: "/dashboard", Icon: LayoutGrid },
  { label: "Analysis", href: "/analyze", Icon: BarChart3 },
  { label: "Personas", href: "/personas", Icon: Users },
  { label: "Strategy", href: "/strategy", Icon: Sparkles },
  { label: "Bias", href: "/bias", Icon: Scale },
  { label: "Countries", href: "/countries", Icon: Globe2 },
];

/**
 * Bottom tab bar for phones. The top-bar ModuleNav is hidden below `md`
 * and the ⌘K palette has no keyboard shortcut on touch devices, so this is
 * the only module-to-module route on small screens. Hidden at `md` and up.
 * Pages that mount it should add bottom padding (see PageShell).
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Modules"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-6">
        {TABS.map(({ label, href, Icon }) => {
          const current =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  current ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={current ? 2 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
