"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, RotateCcw, Paperclip, FileSpreadsheet, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

const EXAMPLES = [
  "Analyze a startup idea and create a launch strategy.",
  "Research the MENA fintech market and design a lead-capture automation.",
  "Take this sales data, find the trends, turn them into an action plan.",
];

const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MB

interface CsvFile {
  name: string;
  content: string;
}

interface MissionPanelProps {
  /** Whether the orchestration engine is running. */
  loading: boolean;
  /** Error message, if any. */
  error: string | null;
  /** Trigger a new orchestration run (optionally with an uploaded CSV). */
  conduct: (mission: string, csv?: CsvFile) => Promise<void>;
  /** Reset state and clear outputs. */
  onReset: () => void;
}

/** Left panel — where a mission is entered and conducted. */
export function MissionPanel({ loading, error, conduct, onReset }: MissionPanelProps) {
  const [mission, setMission] = useState("");
  const [csv, setCsv] = useState<CsvFile | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleConduct = async () => {
    if (!mission.trim() || loading) return;
    await conduct(mission, csv ?? undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleConduct();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setCsvError("Please choose a .csv file.");
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setCsvError("File too large (max 2 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCsv({ name: file.name, content: String(reader.result ?? "") });
    reader.onerror = () => setCsvError("Could not read the file.");
    reader.readAsText(file);
    // allow re-selecting the same file later
    e.target.value = "";
  };

  const kb = csv ? Math.max(1, Math.round(csv.content.length / 1024)) : 0;

  return (
    <GlassPanel eyebrow="Mission" className="flex h-full flex-col">
      <textarea
        value={mission}
        onChange={(e) => setMission(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Give MAESTRO a mission…"
        disabled={loading}
        className="min-h-[120px] flex-1 resize-none rounded-xl border border-white/[0.05] bg-obsidian-900/60 p-3 font-sans text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
      />

      {/* Example mission chips */}
      <div className="mt-3 flex flex-col gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => setMission(ex)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-left font-mono text-[10px] leading-snug text-text-secondary transition hover:border-accent/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* CSV upload — gives the Data agent REAL numbers */}
      <div className="mt-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="hidden"
        />
        {csv ? (
          <div
            className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
            style={{ borderColor: "rgb(45 212 191 / 0.35)", background: "rgb(45 212 191 / 0.08)" }}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" style={{ color: "#2DD4BF" }} />
            <span className="flex-1 truncate font-mono text-[10px] text-text-secondary">
              {csv.name}
            </span>
            <span className="font-mono text-[9px] text-text-tertiary">{kb} KB</span>
            <button
              type="button"
              onClick={() => setCsv(null)}
              disabled={loading}
              className="text-text-tertiary transition hover:text-text-primary disabled:opacity-40"
              title="Remove file"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.12] px-2.5 py-1.5 font-mono text-[10px] text-text-tertiary transition hover:border-accent/40 hover:text-text-secondary disabled:opacity-40"
          >
            <Paperclip className="h-3 w-3" />
            Attach a CSV for real data analysis
          </button>
        )}
        {csvError ? (
          <p className="mt-1 font-mono text-[9px] text-red-400">{csvError}</p>
        ) : null}
      </div>

      {/* Conduct button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleConduct}
        disabled={!mission.trim() || loading}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.15] py-2.5 font-display text-sm font-semibold text-text-primary transition hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>
            Orchestrating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Conduct
          </>
        )}
      </motion.button>

      {/* Status / error row */}
      <div className="mt-2 flex h-5 items-center justify-between">
        {error ? (
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-red-400">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span className="truncate">{error}</span>
          </p>
        ) : (
          <p className="font-mono text-[10px] text-text-tertiary">
            ▮ {loading ? "engine: running" : "engine: standby"}
          </p>
        )}

        {/* Reset button — only shown when not loading */}
        {!loading && (
          <button
            type="button"
            onClick={onReset}
            className="text-text-tertiary transition hover:text-text-secondary"
            title="Clear outputs"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="mt-1 text-right font-mono text-[9px] text-text-tertiary/50">
        ⌘ + ↵ to conduct
      </p>
    </GlassPanel>
  );
}
