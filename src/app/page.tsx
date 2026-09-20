import { redirect } from "next/navigation";

// proxy.ts is the real gate — it inspects the session cookie and sends
// visitors straight to /generate/dashboard or /login without ever reaching
// this component. This redirect only exists as a fallback.
export default function RootPage() {
  redirect("/generate/dashboard");
}
