import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import logo from "../../public/certifly.jpg";
import { Dots, Squiggle } from "@/components/MemphisShapes";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "CertiFly — Automated certificate issuance",
  description: "Event-driven certificate generation, verification, and delivery.",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-bold text-ink-dim hover:text-accent transition-colors"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <header className="relative overflow-hidden border-b border-line bg-surface shadow-soft">
          <Dots className="hidden sm:block absolute -top-1 right-24 h-6 w-16 text-sun" />
          <Squiggle className="hidden sm:block absolute bottom-1 right-4 h-4 w-24 text-accent" />
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logo}
                alt="CertiFly"
                className="h-14 w-14 border border-line shadow-soft"
                priority
              />
            </Link>
            <nav className="flex items-center gap-6">
              <NavLink href="/certificates">Release Certificates</NavLink>
              <NavLink href="/generate/dashboard">Generate</NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line bg-surface-2">
          <div className="max-w-5xl mx-auto px-5 py-6 text-xs text-ink-dim flex items-center justify-between gap-4">
            <p>
              powered by <strong className="text-ink">JK Gulle</strong>
            </p>
            <Squiggle className="h-4 w-20 text-grape shrink-0" />
          </div>
        </footer>
      </body>
    </html>
  );
}
