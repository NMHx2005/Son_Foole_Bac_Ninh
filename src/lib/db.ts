import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type PartCategory = "screen" | "battery" | "cell" | "warranty" | "other";

export type PartRecord = {
  id: number;
  lookup_key: string;
  fingerprint: string;
  category: PartCategory;
  brand: string | null;
  model: string;
  variant: string | null;
  part_code: string | null;
  color: string | null;
  size: string | null;
  resolution: string | null;
  capacity: string | null;
  price_rmb: number | null;
  price_vnd: number | null;
  paper_box_price_vnd: number | null;
  iron_box_price_vnd: number | null;
  warranty_info: string | null;
  note: string | null;
  source_file: string | null;
  source_sheet: string | null;
  search_text: string;
  raw_json: string | null;
  import_batch_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ImportBatch = {
  id: number;
  filename: string;
  file_type: string;
  created_count: number;
  updated_count: number;
  unchanged_count: number;
  duplicate_count: number;
  error_count: number;
  created_at: string;
};

export type ImportIssue = {
  id: number;
  batch_id: number;
  row_number: number | null;
  sheet_name: string | null;
  level: "warning" | "error";
  message: string;
  raw_json: string | null;
  created_at: string;
};

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DATABASE_PATH)
  : path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "prices.sqlite");
const isReadOnlyRuntime = process.env.VERCEL === "1" || process.env.DB_READONLY === "1";

declare global {
  var __fooleDb: Database.Database | undefined;
}

function openDatabase() {
  if (isReadOnlyRuntime) {
    if (!fs.existsSync(dbPath)) {
      console.warn(`SQLite database was not found at ${dbPath}. Search will return empty data.`);
      const db = new Database(":memory:");
      migrate(db);
      return db;
    }

    const db = new Database(dbPath, {
      readonly: true,
      fileMustExist: true,
    });
    db.pragma("query_only = ON");
    return db;
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  return db;
}

export function getDb() {
  if (!global.__fooleDb) {
    global.__fooleDb = openDatabase();
  }

  return global.__fooleDb;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      created_count INTEGER NOT NULL DEFAULT 0,
      updated_count INTEGER NOT NULL DEFAULT 0,
      unchanged_count INTEGER NOT NULL DEFAULT 0,
      duplicate_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lookup_key TEXT NOT NULL UNIQUE,
      fingerprint TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      model TEXT NOT NULL,
      variant TEXT,
      part_code TEXT,
      color TEXT,
      size TEXT,
      resolution TEXT,
      capacity TEXT,
      price_rmb REAL,
      price_vnd INTEGER,
      paper_box_price_vnd INTEGER,
      iron_box_price_vnd INTEGER,
      warranty_info TEXT,
      note TEXT,
      source_file TEXT,
      source_sheet TEXT,
      search_text TEXT NOT NULL,
      raw_json TEXT,
      import_batch_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(import_batch_id) REFERENCES import_batches(id)
    );

    CREATE TABLE IF NOT EXISTS import_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      row_number INTEGER,
      sheet_name TEXT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      raw_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(batch_id) REFERENCES import_batches(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
    CREATE INDEX IF NOT EXISTS idx_parts_updated_at ON parts(updated_at);
    CREATE INDEX IF NOT EXISTS idx_parts_search_text ON parts(search_text);
    CREATE INDEX IF NOT EXISTS idx_import_batches_created_at ON import_batches(created_at);
  `);
}
