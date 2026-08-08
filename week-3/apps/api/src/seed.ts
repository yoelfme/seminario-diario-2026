import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COUNT = Number(process.argv[2] ?? 50_000);

const FIRST_NAMES = [
  "Ana",
  "Carlos",
  "Maria",
  "Diego",
  "Sofia",
  "Luis",
  "Elena",
  "Jorge",
  "Lucia",
  "Miguel",
  "Isabel",
  "Andres",
  "Camila",
  "Rafael",
  "Valeria",
  "Fernando",
  "Daniela",
  "Pablo",
  "Gabriela",
  "Mateo",
  "Paula",
  "Nicolas",
  "Laura",
  "Sebastian",
  "Carmen",
  "Alejandro",
  "Natalia",
  "Ricardo",
  "Andrea",
  "Tomas",
];

const LAST_NAMES = [
  "Garcia",
  "Lopez",
  "Martinez",
  "Rodriguez",
  "Hernandez",
  "Gonzalez",
  "Perez",
  "Sanchez",
  "Ramirez",
  "Torres",
  "Flores",
  "Rivera",
  "Gomez",
  "Diaz",
  "Cruz",
  "Morales",
  "Ortiz",
  "Gutierrez",
  "Chavez",
  "Mendoza",
  "Vargas",
  "Castillo",
  "Jimenez",
  "Ruiz",
  "Alvarez",
];

const ORGANIZATIONS = [
  "Meridian Labs",
  "SynthMind",
  "Universidad de San Carlos",
  "UVG",
  "Galileo University",
  "TechCorp GT",
  "DataPulse",
  "CloudNine AI",
  "NeuronWorks",
  "ByteForge",
  "Horizon Systems",
  "PixelCraft",
  "OpenSource GT",
  "Startup Hub",
  "Banco Industrial",
  "Tigo",
  "Claro",
  "Microsoft",
  "Google",
  "Independent",
];

const TICKET_TYPES = ["student", "professional", "speaker"] as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const dbPath = join(dataDir, "registrations.db");

mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

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

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function phoneFor(index: number): string {
  const base = 50000000 + (index % 49_999_999);
  return `+502 ${String(base).slice(0, 4)}-${String(base).slice(4)}`;
}

const insert = db.prepare(`
  INSERT INTO registrations (full_name, email, phone, organization, ticket_type, years_experience)
  VALUES (@full_name, @email, @phone, @organization, @ticket_type, @years_experience)
`);

const seedMany = db.transaction((count: number) => {
  for (let i = 0; i < count; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const fullName = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}.${i}@example.com`;

    insert.run({
      full_name: fullName,
      email,
      phone: phoneFor(i),
      organization: pick(ORGANIZATIONS),
      ticket_type: pick(TICKET_TYPES),
      years_experience: Math.floor(Math.random() * 41),
    });
  }
});

const before = (
  db.prepare(`SELECT COUNT(*) AS count FROM registrations`).get() as {
    count: number;
  }
).count;

console.log(`Seeding ${COUNT.toLocaleString()} attendees into ${dbPath}…`);
const started = performance.now();
seedMany(COUNT);
const elapsed = performance.now() - started;

const after = (
  db.prepare(`SELECT COUNT(*) AS count FROM registrations`).get() as {
    count: number;
  }
).count;

console.log(
  `Done in ${elapsed.toFixed(0)}ms. Registrations: ${before.toLocaleString()} → ${after.toLocaleString()}`,
);
console.log(
  "Open http://localhost:3000/attendees to browse registrations with pagination (50 per page).",
);

db.close();
