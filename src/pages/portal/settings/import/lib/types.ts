export type DataType = "owners" | "pets" | "vaccinations" | "reservations";
export type SourceSystem = "gingr" | "petexec" | "daysmart" | "other";

export type ParsedFile = {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
};

export type ColumnMapping = Record<string, string>; // snoutField -> csvHeader

export type RowIssue = {
  severity: "error" | "warning";
  field: string;
  message: string;
};

export type ValidatedRow = {
  index: number; // 0-based row index in original file
  raw: Record<string, string>;
  mapped: Record<string, any>;
  issues: RowIssue[];
  include: boolean;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errored: number;
  errorRows: { row: number; reason: string; data: Record<string, string> }[];
};
