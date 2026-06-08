import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  active?: boolean;
}

/** Dark Liquid Glass container. Use `eyebrow` for the mono section label. */
export function GlassPanel({
  children,
  className,
  eyebrow,
  active,
}: GlassPanelProps) {
  return (
    <section className={cn("glass p-5", active && "glass--active", className)}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      {children}
    </section>
  );
}
