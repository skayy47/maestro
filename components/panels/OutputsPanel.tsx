import { Radio } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

/** Right panel — where agent results stream in during a performance. */
export function OutputsPanel() {
  return (
    <GlassPanel eyebrow="Live Outputs" className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-white/[0.08] bg-white/[0.02]">
          <Radio className="h-6 w-6 text-text-tertiary" />
        </div>
        <p className="font-display text-sm text-text-secondary">
          Awaiting performance
        </p>
        <p className="max-w-[220px] font-sans text-xs leading-relaxed text-text-tertiary">
          Agent results stream here as the orchestra plays.
        </p>
      </div>
    </GlassPanel>
  );
}
