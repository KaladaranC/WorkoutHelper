"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, Dumbbell, LineChart, Settings, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/plan", label: "Plan", icon: CalendarRange },
  { href: "/moves", label: "Moves", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
] as const;

export function AppNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link href="/" className="font-scoreboard text-[1.75rem] font-extrabold tracking-wide uppercase">
          Spotter
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active(t.href) ? "page" : undefined}
              className={cn(
                "press rounded-full px-3.5 py-1.5 text-sm font-medium text-muted hover:text-foreground",
                active(t.href) && "bg-foreground text-background hover:text-background",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/settings"
          aria-label="Settings"
          className={cn(
            "press grid size-10 place-items-center rounded-full text-muted hover:text-foreground",
            path.startsWith("/settings") && "text-foreground",
          )}
        >
          <Settings className="size-5" />
        </Link>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold text-muted",
                  active(href) && "text-primary",
                )}
              >
                <Icon className="size-5" strokeWidth={active(href) ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
