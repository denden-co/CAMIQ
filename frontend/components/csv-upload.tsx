"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";

export interface CsvParseResult {
  filename: string;
  headers: string[];
  rows: Record<string, string>[];
}

interface Props {
  /** Called when the user confirms the column to use. */
  onColumnSelected: (texts: string[], meta: { filename: string; column: string }) => void;
  /** Max rows forwarded to the batch endpoint. */
  maxRows?: number;
}

/**
 * CSV drop-zone → papaparse → auto-detect text column → preview → confirm.
 *
 * Auto-detection heuristic: pick the column whose non-empty cells have the
 * longest mean character length. That's almost always the "text / body /
 * tweet / message" column in social-media exports.
 */
export function CsvUpload({ onColumnSelected, maxRows = 500 }: Props) {
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [selectedCol, setSelectedCol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    setParsed(null);
    setSelectedCol(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please drop a .csv file.");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data ?? []).filter(Boolean);
        if (rows.length === 0) {
          setError("CSV is empty or has no data rows.");
          return;
        }
        const headers = results.meta.fields ?? Object.keys(rows[0] ?? {});
        if (headers.length === 0) {
          setError("CSV has no header row. Please add column names.");
          return;
        }
        const best = pickTextColumn(headers, rows);
        setParsed({ filename: file.name, headers, rows });
        setSelectedCol(best);
      },
      error: (err) => setError(`Parse error: ${err.message}`),
    });
  }

  function handleConfirm() {
    if (!parsed || !selectedCol) return;
    const texts = parsed.rows
      .map((r) => (r[selectedCol] ?? "").toString().trim())
      .filter((t) => t.length > 0)
      .slice(0, maxRows);
    if (texts.length === 0) {
      setError(`Column "${selectedCol}" is empty across all rows.`);
      return;
    }
    onColumnSelected(texts, { filename: parsed.filename, column: selectedCol });
  }

  function reset() {
    setParsed(null);
    setSelectedCol(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!parsed) {
    return (
      <div className="mt-8 space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <p className="text-lg font-medium">
            Drop a CSV here, or click to choose a file
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            First row must be a header. We&apos;ll auto-pick the text column and
            let you change it before running.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  const previewRows = parsed.rows.slice(0, 5);
  const totalUsable = parsed.rows.filter((r) =>
    selectedCol ? (r[selectedCol] ?? "").toString().trim().length > 0 : false
  ).length;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm">
        <span className="font-medium">{parsed.filename}</span>
        <span className="text-muted-foreground">
          · {parsed.rows.length.toLocaleString()} rows ·{" "}
          {parsed.headers.length} columns
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reset}
          className="ml-auto"
        >
          Choose different file
        </Button>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Text column
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {parsed.headers.map((h) => (
            <button
              type="button"
              key={h}
              onClick={() => setSelectedCol(h)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                selectedCol === h
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {selectedCol && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-10 px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                  {selectedCol}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {previewRows.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <span className="line-clamp-2">
                      {(r[selectedCol] ?? "").toString() || (
                        <span className="italic text-muted-foreground">
                          (empty)
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!selectedCol || totalUsable === 0}
          onClick={handleConfirm}
        >
          Analyse {Math.min(totalUsable, maxRows)} rows
        </Button>
        {totalUsable > maxRows && (
          <span className="text-xs text-muted-foreground">
            Only the first {maxRows} non-empty rows will be sent (batch cap).
          </span>
        )}
        {totalUsable === 0 && selectedCol && (
          <span className="text-xs text-red-600">
            Column is empty — pick a different one.
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

function pickTextColumn(
  headers: string[],
  rows: Record<string, string>[]
): string {
  // Name-based hints get a boost so a short "tweet" column beats a longer "url".
  const hintRegex = /(text|body|tweet|message|content|post|comment|caption|description|title)/i;
  let bestScore = -1;
  let best = headers[0];
  for (const h of headers) {
    const sample = rows.slice(0, 200);
    let totalLen = 0;
    let nonEmpty = 0;
    for (const r of sample) {
      const v = (r[h] ?? "").toString().trim();
      if (v.length > 0) {
        nonEmpty += 1;
        totalLen += v.length;
      }
    }
    if (nonEmpty === 0) continue;
    const mean = totalLen / nonEmpty;
    const hinted = hintRegex.test(h) ? 1.4 : 1.0;
    const score = mean * hinted;
    if (score > bestScore) {
      bestScore = score;
      best = h;
    }
  }
  return best;
}
