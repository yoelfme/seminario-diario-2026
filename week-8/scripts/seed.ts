import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { faker } from "@faker-js/faker";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/postgres";

const CUSTOMERS = Number(process.env.SEED_CUSTOMERS ?? 200_000);
const PRODUCTS = Number(process.env.SEED_PRODUCTS ?? 10_000);
const ORDERS = Number(process.env.SEED_ORDERS ?? 2_500_000);
const ORDER_ITEMS = Number(process.env.SEED_ORDER_ITEMS ?? 10_000_000);
const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE ?? 50_000);
const FORCE = process.env.SEED_FORCE === "1" || process.env.SEED_FORCE === "true";

const CATEGORIES = [
  "Laptops",
  "Smartphones",
  "Tablets",
  "GPUs",
  "CPUs",
  "Monitors",
  "Headphones",
  "Keyboards",
  "Mice",
  "Storage",
  "Routers",
  "Smartwatches",
  "Cameras",
  "Speakers",
  "Power Banks",
] as const;

const BRANDS = [
  "NovaTech",
  "Aether",
  "PixelForge",
  "Voltix",
  "Skyline",
  "QuantumBit",
  "Orbitron",
  "Nimbus",
  "CoreWave",
  "Lumen",
] as const;

const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

faker.seed(2026);

const sql = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 0,
  connect_timeout: 30,
});

function escapeTsv(value: string | number): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\t/g, "\\t")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function formatTs(date: Date): string {
  return date.toISOString();
}

async function* batchLines(
  total: number,
  batchSize: number,
  buildRow: (index: number) => string,
  label: string,
): AsyncGenerator<string, void, unknown> {
  let produced = 0;
  while (produced < total) {
    const size = Math.min(batchSize, total - produced);
    const chunk: string[] = [];
    for (let i = 0; i < size; i += 1) {
      chunk.push(buildRow(produced + i));
    }
    produced += size;
    if (produced % (batchSize * 4) === 0 || produced === total) {
      console.log(`  ${label}: ${produced.toLocaleString()} / ${total.toLocaleString()}`);
    }
    yield chunk.join("");
  }
}

async function copyTable(
  copySql: postgres.PendingQuery<postgres.Row[]>,
  total: number,
  batchSize: number,
  buildRow: (index: number) => string,
  label: string,
) {
  const writable = await copySql.writable();
  await pipeline(
    Readable.from(batchLines(total, batchSize, buildRow, label)),
    writable,
  );
}

async function alreadySeeded(): Promise<boolean> {
  const rows = await sql<{
    customers: string;
    products: string;
    orders: string;
    order_items: string;
  }[]>`
    SELECT
      (SELECT count(*)::text FROM customers) AS customers,
      (SELECT count(*)::text FROM products) AS products,
      (SELECT count(*)::text FROM orders) AS orders,
      (SELECT count(*)::text FROM order_items) AS order_items
  `;
  const counts = rows[0];
  if (!counts) return false;
  return (
    Number(counts.customers) >= CUSTOMERS &&
    Number(counts.products) >= PRODUCTS &&
    Number(counts.orders) >= ORDERS &&
    Number(counts.order_items) >= ORDER_ITEMS
  );
}

async function applySchema() {
  const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  await sql.unsafe(schema);
}

async function dropSecondaryIndexes() {
  await sql.unsafe(`
    DROP INDEX IF EXISTS idx_orders_customer_id;
    DROP INDEX IF EXISTS idx_orders_created_at;
    DROP INDEX IF EXISTS idx_order_items_order_id;
    DROP INDEX IF EXISTS idx_order_items_product_id;
    DROP INDEX IF EXISTS idx_customers_email;
    DROP INDEX IF EXISTS idx_products_category;
  `);
}

async function recreateConstraintsAndIndexes() {
  console.log("Recreating foreign keys and indexes...");
  await sql.unsafe(`
    ALTER TABLE orders
      ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id);

    ALTER TABLE order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES orders(id);

    ALTER TABLE order_items
      ADD CONSTRAINT order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id);

    CREATE INDEX idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
    CREATE INDEX idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX idx_order_items_product_id ON order_items(product_id);
    CREATE INDEX idx_customers_email ON customers(email);
    CREATE INDEX idx_products_category ON products(category);
  `);
}

function customerRow(i: number): string {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const email = `customer${i + 1}.${faker.internet.email({ firstName, lastName }).toLowerCase()}`;
  const city = faker.location.city();
  const createdAt = faker.date.past({ years: 3 });
  return `${escapeTsv(fullName)}\t${escapeTsv(email)}\t${escapeTsv(city)}\t${formatTs(createdAt)}\n`;
}

function productRow(i: number): string {
  const category = CATEGORIES[i % CATEGORIES.length]!;
  const brand = BRANDS[i % BRANDS.length]!;
  const sku = `SKU-${String(i + 1).padStart(6, "0")}`;
  const name = `${brand} ${category.slice(0, -1)} ${faker.commerce.productAdjective()} ${i + 1}`;
  const price = faker.number.float({ min: 19.99, max: 2499.99, fractionDigits: 2 });
  const createdAt = faker.date.past({ years: 2 });
  return `${escapeTsv(sku)}\t${escapeTsv(name)}\t${escapeTsv(brand)}\t${escapeTsv(category)}\t${price}\t${formatTs(createdAt)}\n`;
}

function orderRow(i: number): string {
  const customerId = (i % CUSTOMERS) + 1;
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length]!;
  const total = faker.number.float({ min: 19.99, max: 4999.99, fractionDigits: 2 });
  const createdAt = faker.date.past({ years: 2 });
  return `${customerId}\t${escapeTsv(status)}\t${total}\t${formatTs(createdAt)}\n`;
}

function orderItemRow(i: number): string {
  const orderId = (i % ORDERS) + 1;
  const productId = (i % PRODUCTS) + 1;
  const qty = faker.number.int({ min: 1, max: 5 });
  // Deterministic-ish unit price from product index so we avoid a lookup.
  const unitPrice = Number((((productId * 37) % 2400) + 19.99).toFixed(2));
  return `${orderId}\t${productId}\t${qty}\t${unitPrice}\n`;
}

async function main() {
  console.log("Connecting to Postgres...");
  await sql`SELECT 1`;

  const tablesExist = await sql`
    SELECT to_regclass('public.order_items') IS NOT NULL AS exists
  `;
  if (tablesExist[0]?.exists && !FORCE) {
    if (await alreadySeeded()) {
      console.log(
        `Seed already present (>= ${ORDER_ITEMS.toLocaleString()} order_items). Set SEED_FORCE=1 to reseed.`,
      );
      await sql.end();
      return;
    }
  }

  console.log("Applying schema (drops existing store tables)...");
  await applySchema();
  await dropSecondaryIndexes();

  await sql.unsafe("SET client_min_messages TO WARNING");
  await sql.unsafe("SET synchronous_commit = off");
  await sql.unsafe("SET maintenance_work_mem = '512MB'");

  const started = Date.now();

  console.log(`Seeding customers (${CUSTOMERS.toLocaleString()})...`);
  await copyTable(
    sql`COPY customers (full_name, email, city, created_at) FROM STDIN`,
    CUSTOMERS,
    BATCH_SIZE,
    customerRow,
    "customers",
  );

  console.log(`Seeding products (${PRODUCTS.toLocaleString()})...`);
  await copyTable(
    sql`COPY products (sku, name, brand, category, price, created_at) FROM STDIN`,
    PRODUCTS,
    BATCH_SIZE,
    productRow,
    "products",
  );

  console.log(`Seeding orders (${ORDERS.toLocaleString()})...`);
  await copyTable(
    sql`COPY orders (customer_id, status, total, created_at) FROM STDIN`,
    ORDERS,
    BATCH_SIZE,
    orderRow,
    "orders",
  );

  console.log(`Seeding order_items (${ORDER_ITEMS.toLocaleString()})...`);
  await copyTable(
    sql`COPY order_items (order_id, product_id, qty, unit_price) FROM STDIN`,
    ORDER_ITEMS,
    BATCH_SIZE,
    orderItemRow,
    "order_items",
  );

  await recreateConstraintsAndIndexes();
  await sql.unsafe("ANALYZE customers, products, orders, order_items");

  const counts = await sql`
    SELECT
      (SELECT count(*) FROM customers) AS customers,
      (SELECT count(*) FROM products) AS products,
      (SELECT count(*) FROM orders) AS orders,
      (SELECT count(*) FROM order_items) AS order_items
  `;

  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);
  console.log("Seed complete:", counts[0]);
  console.log(`Elapsed: ${elapsedSec}s`);
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end({ timeout: 1 });
  process.exit(1);
});
