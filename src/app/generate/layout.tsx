import type { ReactNode } from "react";
import { GenerateNav } from "@/components/GenerateNav";

export default function GenerateLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="border-b-2 border-line bg-surface-2">
        <div className="max-w-5xl mx-auto px-5">
          <GenerateNav />
        </div>
      </div>
      {children}
    </div>
  );
}
