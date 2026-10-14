"use client";
import { useState } from "react";
import { helpResponseSchema } from "@/lib/feedback/types";
import { postJson } from "./api-client";
import { recordEvent } from "@/lib/metrics";
export function StuckHelp({ step }: { step: "lesson" | "guide" | "activity-observe" | "activity-questions" | "activity-fictional" }) {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function help() {
    setBusy(true); setError("");
    recordEvent("help_requested", { step });
    try { setResult((await postJson("/api/help", { step }, helpResponseSchema)).hint); }
    catch { setError("Help could not load. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="stuck-help"><button type="button" className="secondary" disabled={busy} onClick={help}>{busy ? "Loading help…" : "Stuck?"}</button>
    <div aria-live="polite">{result && <p className="hint">{result}</p>}{error && <p role="alert">{error}</p>}</div></div>;
}
