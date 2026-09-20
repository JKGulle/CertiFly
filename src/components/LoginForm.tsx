"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Squiggle, Triangle } from "@/components/MemphisShapes";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirmPassword("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : mode === "signup" ? "Sign up failed" : "Login failed"
        );
      }
      router.push("/generate/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative max-w-sm mx-auto px-5 py-20 overflow-hidden">
      <Triangle className="hidden sm:block absolute -top-2 right-4 h-8 w-8 text-sun" />
      <h1 className="font-display text-3xl mb-1 text-center">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <p className="text-sm text-ink-dim mb-8 text-center">
        {mode === "login"
          ? "Sign in to generate, review, and manage certificates."
          : "Set up an account to generate, review, and manage certificates."}
      </p>

      <div className="flex gap-2 mb-4 justify-center">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`text-sm font-bold px-3 py-1.5 border-2 border-ink rounded-full transition-colors ${
            mode === "login" ? "bg-accent text-white" : "bg-surface text-ink-dim hover:text-ink"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`text-sm font-bold px-3 py-1.5 border-2 border-ink rounded-full transition-colors ${
            mode === "signup" ? "bg-accent text-white" : "bg-surface text-ink-dim hover:text-ink"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-surface shadow-soft p-5 space-y-4">
        <div>
          <label className="block text-xs text-ink-dim mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-ink-dim mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
            minLength={mode === "signup" ? 8 : undefined}
            required
          />
        </div>
        {mode === "signup" && (
          <div>
            <label className="block text-xs text-ink-dim mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
              minLength={8}
              required
            />
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent text-white font-bold text-sm px-4 py-2 shadow-soft"
        >
          {submitting
            ? mode === "login"
              ? "Signing in…"
              : "Creating account…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
      <Squiggle className="h-4 w-24 text-grape mx-auto mt-8" />
    </div>
  );
}
