"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ActionButton({
  href,
  label,
  pendingLabel,
  className,
  confirmMessage,
}: {
  href: string;
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setPending(true);
    try {
      await fetch(href, { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={
        className
          ? `${className} hover:brightness-75`
          : "text-xs font-bold text-accent underline disabled:opacity-50 hover:brightness-75"
      }
    >
      {pending ? pendingLabel ?? "Working…" : label}
    </button>
  );
}
