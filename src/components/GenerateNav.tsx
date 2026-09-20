"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const TABS = [
  { href: "/generate/dashboard", label: "Dashboard" },
  { href: "/generate", label: "Create certificate" },
  { href: "/generate/reports", label: "Reports" },
  { href: "/generate/templates", label: "Templates" },
  { href: "/generate/certificates", label: "Certificates" },
];

export function GenerateNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav className="flex items-center gap-3 overflow-x-auto py-3">
      {TABS.map((tab) => {
        const active = tab.href === "/generate" ? pathname === "/generate" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm font-bold whitespace-nowrap px-3 py-1.5 border-2 border-ink rounded-full transition-colors ${
              active
                ? "bg-accent text-white"
                : "bg-surface text-ink-dim hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="ml-auto text-sm font-bold text-ink-dim underline disabled:opacity-50 whitespace-nowrap"
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </nav>
  );
}
