import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, AlertTriangle, CheckCircle2, Link2, Link2Off } from "lucide-react";
import { validateRows } from "./lib/validators";
import type { ColumnMapping, DataType, MatchStats, ParsedFile, ValidatedRow } from "./lib/types";

export default function StepValidate({
  dataType,
  parsed,
  mapping,
  organizationId,
  rows,
  onRowsChange,
  onBack,
  onNext,
}: {
  dataType: DataType;
  parsed: ParsedFile;
  mapping: ColumnMapping;
  organizationId: string;
  rows: ValidatedRow[];
  onRowsChange: (r: ValidatedRow[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(rows.length === 0);
  const [skipErrors, setSkipErrors] = useState(true);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  useEffect(() => {
    if (rows.length === 0) {
      setLoading(true);
      validateRows(parsed, dataType, mapping, organizationId)
        .then((result) => {
          onRowsChange(result.rows);
          setMatchStats(result.matchStats ?? null);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRows = rows.length;
  const errorRows = rows.filter((r) => r.issues.some((i) => i.severity === "error"));
  const warningRows = rows.filter(
    (r) => r.issues.some((i) => i.severity === "warning") && !r.issues.some((i) => i.severity === "error"),
  );
  const cleanRows = rows.filter((r) => r.issues.length === 0);
  const flaggedRows = rows.filter((r) => r.issues.length > 0);
  const includedCount = rows.filter((r) => r.include).length;
  const unlinkedRows = rows.filter((r) => r.matchMethod === "none" && (r.raw && Object.keys(r.raw).length));

  function toggleRow(index: number) {
    onRowsChange(rows.map((r) => (r.index === index ? { ...r, include: !r.include } : r)));
  }

  function applySkipErrors(v: boolean) {
    setSkipErrors(v);
    onRowsChange(
      rows.map((r) => {
        if (v && r.issues.some((i) => i.severity === "error")) return { ...r, include: false };
        if (!v) return { ...r, include: true };
        return r;
      }),
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-accent" />
        <div className="mt-3 text-sm text-text-secondary">Validating {parsed.rows.length} rows…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-text-secondary">Total Rows</div>
          <div className="text-2xl font-display mt-1">{totalRows}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-success">
          <div className="text-xs uppercase tracking-wide text-text-secondary flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </div>
          <div className="text-2xl font-display mt-1">{cleanRows.length}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-warning">
          <div className="text-xs uppercase tracking-wide text-text-secondary flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Warnings
          </div>
          <div className="text-2xl font-display mt-1">{warningRows.length}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-destructive">
          <div className="text-xs uppercase tracking-wide text-text-secondary flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Errors
          </div>
          <div className="text-2xl font-display mt-1">{errorRows.length}</div>
        </Card>
      </div>

      {matchStats && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-accent" />
            <h3 className="font-display text-base">Owner match quality</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary">Email</div>
              <div className="text-xl font-display mt-1">{matchStats.email}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary">External ID</div>
              <div className="text-xl font-display mt-1">{matchStats.external_id}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary">Exact name</div>
              <div className="text-xl font-display mt-1">{matchStats.exact}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary">Last name</div>
              <div className="text-xl font-display mt-1">{matchStats.last_name}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-secondary flex items-center gap-1">
                <Link2Off className="h-3 w-3" /> Unlinked
              </div>
              <div className="text-xl font-display mt-1 text-warning">{matchStats.unlinked}</div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Switch id="skip-errors" checked={skipErrors} onCheckedChange={applySkipErrors} />
        <Label htmlFor="skip-errors" className="cursor-pointer">
          Skip all rows with errors
        </Label>
      </div>

      {dataType === "pets" && unlinkedRows.length > 0 && (
        <div>
          <h3 className="font-display text-base mb-3">Unlinked pets ({unlinkedRows.length})</h3>
          <Card className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Pet</th>
                  <th className="px-3 py-2 text-left">Tried to match</th>
                  <th className="px-3 py-2 text-left">Closest owner</th>
                </tr>
              </thead>
              <tbody>
                {unlinkedRows.slice(0, 100).map((r) => (
                  <tr key={r.index} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{r.index + 2}</td>
                    <td className="px-3 py-2">{r.mapped.name}</td>
                    <td className="px-3 py-2 text-text-secondary">
                      {r.raw["o_name"] || r.raw["owner_name"] || r.raw["Owner"] || "—"}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {r.matchSuggestion ?? <span className="italic">no close match</span>}
                    </td>
                  </tr>
                ))}
                {unlinkedRows.length > 100 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-text-secondary italic">
                      … and {unlinkedRows.length - 100} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {flaggedRows.length > 0 && (
        <div>
          <h3 className="font-display text-base mb-3">Flagged rows ({flaggedRows.length})</h3>
          <Card className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Issues</th>
                  <th className="px-3 py-2 text-left">Data preview</th>
                </tr>
              </thead>
              <tbody>
                {flaggedRows.slice(0, 200).map((r) => (
                  <tr key={r.index} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Checkbox checked={r.include} onCheckedChange={() => toggleRow(r.index)} />
                    </td>
                    <td className="px-3 py-2 font-mono">{r.index + 2}</td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {r.issues.map((i, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <Badge
                              variant={i.severity === "error" ? "destructive" : "secondary"}
                              className="text-[10px]"
                            >
                              {i.field}
                            </Badge>
                            <span className="text-text-secondary">{i.message}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-text-secondary truncate max-w-xs">
                      {Object.values(r.raw).slice(0, 4).join(" · ")}
                    </td>
                  </tr>
                ))}
                {flaggedRows.length > 200 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-text-secondary italic">
                      … and {flaggedRows.length - 200} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={includedCount === 0}>
          Import {includedCount} Records
        </Button>
      </div>
    </div>
  );
}
