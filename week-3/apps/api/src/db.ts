import Database from "better-sqlite3";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const dbPath = join(dataDir, "registrations.db");

mkdirSync(dataDir, { recursive: true });

const db: SqliteDatabase = new Database(dbPath);

// Shared with ./idempotency.ts so both features use one connection.
export { db };

db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    organization TEXT,
    ticket_type TEXT,
    years_experience INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export type Registration = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  ticket_type: string | null;
  years_experience: number | null;
  created_at: string;
};

import type { RegistrationInput } from "./registration-schema.js";

export type { RegistrationInput };

const insertRegistration = db.prepare(`
  INSERT INTO registrations (full_name, email, phone, organization, ticket_type, years_experience)
  VALUES (@full_name, @email, @phone, @organization, @ticket_type, @years_experience)
  RETURNING *
`);

export type RegistrationFilters = {
  email?: string;
  organization?: string;
  fullName?: string;
};

function buildFilterClauses(filters: RegistrationFilters) {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.email) {
    clauses.push("LOWER(email) LIKE ?");
    params.push(`%${filters.email.toLowerCase()}%`);
  }

  if (filters.organization) {
    clauses.push("LOWER(organization) LIKE ?");
    params.push(`%${filters.organization.toLowerCase()}%`);
  }

  if (filters.fullName) {
    clauses.push("LOWER(full_name) LIKE ?");
    params.push(`%${filters.fullName.toLowerCase()}%`);
  }

  const whereClause =
    clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return { whereClause, params };
}

export function createRegistration(input: RegistrationInput): Registration {
  const row = insertRegistration.get({
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    organization: input.organization,
    ticket_type: input.ticketType,
    years_experience: input.yearsExperience,
  }) as Registration;

  return row;
}

export function getRegistrations(
  limit: number,
  offset: number,
  filters: RegistrationFilters = {},
): Registration[] {
  const { whereClause, params } = buildFilterClauses(filters);
  const stmt = db.prepare(
    `SELECT * FROM registrations ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  );

  return stmt.all(...params, limit, offset) as Registration[];
}

export function countRegistrations(
  filters: RegistrationFilters = {},
): number {
  const { whereClause, params } = buildFilterClauses(filters);
  const stmt = db.prepare(
    `SELECT COUNT(*) AS count FROM registrations ${whereClause}`,
  );
  const row = stmt.get(...params) as { count: number };

  return row.count;
}

export const conferenceInfo = {
  title: "Neural Horizons 2026",
  subtitle: "The premier AI conference for builders, researchers, and innovators",
  date: "October 15–17, 2026",
  venue: "Guatemala City Convention Center",
  description:
    "Join 2,000+ attendees for three days of keynotes, workshops, and networking focused on generative AI, machine learning infrastructure, and responsible AI deployment.",
  tracks: [
    "Generative AI & LLMs",
    "MLOps & Infrastructure",
    "Computer Vision",
    "AI Ethics & Governance",
    "Applied AI in Industry",
  ],
  speakers: [
    "Dr. Elena Vasquez — Chief AI Officer, Meridian Labs",
    "Prof. James Okonkwo — Stanford HAI",
    "Sofia Chen — Founder, SynthMind",
  ],
};
