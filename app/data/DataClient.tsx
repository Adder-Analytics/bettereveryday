"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  applyBundle,
  buildBundle,
  describeBundle,
  markBackedUp,
  parseBundle,
  summarize,
  type StoreDescriptor,
  type StoreSummary,
} from "./portable";

/**
 * Your data (/data): back up everything this site keeps for you, and restore it.
 *
 * The site stores what you write only in this browser — good for privacy, but
 * localStorage is not durable, so a cleared cache or a new device loses it all.
 * The decision journal already had a per-tool escape hatch; this page is the
 * whole-site version. It reads every registered key (see portable.ts), and:
 *
 *  - Export writes one JSON file that is a faithful snapshot of all of it.
 *  - Restore reads such a file back. Because restore replaces what's here, it
 *    first auto-downloads a safety copy of the current state, then shows exactly
 *    what the incoming file contains and asks you to confirm before it writes.
 *
 * Nothing here talks to a network. The file never leaves your machine unless you
 * move it yourself — which is the entire point: a backup you own and can carry.
 */

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function totalBytes(rows: StoreSummary[]): number {
  return rows.reduce((sum, r) => sum + r.bytes, 0);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
}

/** What a picked file was found to contain, held until the user confirms. */
type Pending = {
  filename: string;
  keys: Record<string, string>;
  rows: { descriptor: StoreDescriptor; detail: string | null }[];
  source: "full" | "legacy-log";
};

export default function DataClient() {
  // Hydrate the live summary once, on the client, from localStorage.
  const [rows, setRows] = useState<StoreSummary[] | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [note, setNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setRows(summarize());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function refresh() {
    setRows(summarize());
  }

  function onExport() {
    try {
      const bundle = buildBundle(todayISO());
      const present = Object.keys(bundle.keys).length;
      if (present === 0) {
        setNote({
          kind: "err",
          text: "There's nothing stored in this browser yet — use a tool first, then come back to back it up.",
        });
        return;
      }
      download(`bettereveryday-backup-${todayISO()}.json`, JSON.stringify(bundle, null, 2));
      // Record the backup so the return desk can stop nudging and start
      // counting from here ("N new decisions since your last backup").
      markBackedUp(todayISO());
      setNote({
        kind: "ok",
        text: `Backed up ${present === 1 ? "1 store" : `${present} stores`} to a file. Keep it somewhere you'll find it — that file is now the only copy that survives clearing this browser.`,
      });
    } catch {
      setNote({ kind: "err", text: "Couldn't create the backup file in this browser." });
    }
  }

  function onPick(file: File) {
    setNote(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseBundle(String(reader.result));
      if (!result.ok) {
        setPending(null);
        setNote({ kind: "err", text: result.error });
        return;
      }
      setPending({
        filename: file.name,
        keys: result.keys,
        rows: describeBundle(result.keys),
        source: result.source,
      });
    };
    reader.onerror = () => {
      setPending(null);
      setNote({ kind: "err", text: "Couldn't read that file." });
    };
    reader.readAsText(file);
  }

  function confirmRestore() {
    if (!pending) return;
    try {
      // Safety net: snapshot what's here now before overwriting it, so a
      // restore is never a one-way door even though it replaces.
      const current = buildBundle(todayISO());
      if (Object.keys(current.keys).length > 0) {
        download(
          `bettereveryday-before-restore-${todayISO()}.json`,
          JSON.stringify(current, null, 2)
        );
      }
      applyBundle(pending.keys);
      const restored = pending.rows.length;
      setPending(null);
      refresh();
      setNote({
        kind: "ok",
        text: `Restored ${restored === 1 ? "1 store" : `${restored} stores`} from ${pending.filename}. A copy of what was here before was saved to your downloads, just in case. Reload a tool to see its restored state.`,
      });
    } catch {
      setNote({ kind: "err", text: "Couldn't restore that backup in this browser." });
    }
  }

  const stored = rows ? rows.filter((r) => r.present) : [];
  const hasData = stored.length > 0;

  return (
    <div>
      {/* Export */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Back up everything</h2>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Save one file holding everything this site keeps for you — your logged
          decisions and their reviews, your armed tripwires, your practice
          record, and whatever you have in progress. Nothing is uploaded; the
          file is written straight to your downloads.
        </p>

        {rows === null ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Reading what&rsquo;s in this browser…</p>
        ) : hasData ? (
          <div className="mt-4">
            <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
              {stored.map((r) => (
                <li key={r.descriptor.key} className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={r.descriptor.href}
                      className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                    >
                      {r.descriptor.tool}
                    </Link>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      {r.detail ?? r.descriptor.label}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)] tabular-nums">
                    {formatBytes(r.bytes)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExport}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
              >
                Download my backup ↓
              </button>
              <span className="text-xs text-[var(--muted)]">
                {stored.length === 1 ? "1 store" : `${stored.length} stores`} ·{" "}
                {formatBytes(totalBytes(stored))}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
            Nothing is stored in this browser yet. Log a decision in the{" "}
            <Link href="/decide" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              journal
            </Link>{" "}
            or take a round in the{" "}
            <Link href="/practice" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              trainers
            </Link>
            , and there&rsquo;ll be something here worth keeping.
          </p>
        )}
      </section>

      {/* Restore */}
      <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Restore from a backup</h2>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Moving to a new browser or device, or coming back after clearing your
          data? Pick a backup file to bring it all here. Restoring{" "}
          <span className="text-[var(--foreground)]">replaces</span> what&rsquo;s
          in this browser with what&rsquo;s in the file — so before it does,
          it&rsquo;ll save a copy of the current state to your downloads, and
          show you exactly what the file holds first.
        </p>

        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
          >
            Choose a backup file…
          </button>
        </div>

        {pending && (
          <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              <span className="font-medium">{pending.filename}</span>
              {pending.source === "legacy-log" && (
                <span className="text-[var(--muted)]"> (an older decision-log backup)</span>
              )}{" "}
              contains:
            </p>
            <ul className="mt-3 space-y-1.5">
              {pending.rows.map((r) => (
                <li key={r.descriptor.key} className="text-sm text-[var(--muted)] leading-relaxed">
                  <span className="text-[var(--foreground)]">{r.descriptor.tool}</span>
                  {" — "}
                  {r.detail ?? r.descriptor.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              Restoring will replace everything currently in this browser with the
              above. Your current state will be downloaded first as{" "}
              <span className="font-mono">bettereveryday-before-restore-{todayISO()}.json</span>.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={confirmRestore}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
              >
                Save a copy, then restore
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {note && (
        <div
          className={`mt-5 rounded-lg border px-4 py-3 text-sm leading-relaxed ${
            note.kind === "ok"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
          }`}
        >
          {note.text}
        </div>
      )}
    </div>
  );
}
