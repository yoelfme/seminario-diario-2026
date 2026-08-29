import { sql } from "./db.js";

export type Product = {
  id: number;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  created_at: string;
};

export type ProductStats = {
  product_id: number;
  units_sold: string;
  revenue: string;
  order_count: string;
};

export type Customer = {
  id: number;
  full_name: string;
  email: string;
  city: string;
  created_at: string;
};

export type OrderSummary = {
  id: number;
  status: string;
  total: string;
  created_at: string;
};

export type TopProduct = {
  product_id: number;
  sku: string;
  name: string;
  brand: string;
  category: string;
  units_sold: string;
  revenue: string;
};

export async function getProductById(id: number): Promise<Product | null> {
  const rows = await sql<Product[]>`
    SELECT id, sku, name, brand, category, price::text, created_at::text
    FROM products
    WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

export async function getProductStats(id: number): Promise<ProductStats> {
  const rows = await sql<ProductStats[]>`
    SELECT
      ${id}::bigint AS product_id,
      COALESCE(SUM(qty), 0)::text AS units_sold,
      COALESCE(SUM(qty * unit_price), 0)::text AS revenue,
      COUNT(DISTINCT order_id)::text AS order_count
    FROM order_items
    WHERE product_id = ${id}
  `;
  return (
    rows[0] ?? {
      product_id: id,
      units_sold: "0",
      revenue: "0",
      order_count: "0",
    }
  );
}

export async function getCustomerWithOrders(
  id: number,
  recentLimit = 10,
): Promise<{ customer: Customer; recent_orders: OrderSummary[] } | null> {
  const customers = await sql<Customer[]>`
    SELECT id, full_name, email, city, created_at::text
    FROM customers
    WHERE id = ${id}
  `;
  const customer = customers[0];
  if (!customer) return null;

  const recentOrders = await sql<OrderSummary[]>`
    SELECT id, status, total::text, created_at::text
    FROM orders
    WHERE customer_id = ${id}
    ORDER BY created_at DESC
    LIMIT ${recentLimit}
  `;

  return { customer, recent_orders: recentOrders };
}

export async function getTopProducts(limit: number): Promise<TopProduct[]> {
  return sql<TopProduct[]>`
    SELECT
      p.id AS product_id,
      p.sku,
      p.name,
      p.brand,
      p.category,
      SUM(oi.qty)::text AS units_sold,
      SUM(oi.qty * oi.unit_price)::text AS revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    GROUP BY p.id, p.sku, p.name, p.brand, p.category
    ORDER BY SUM(oi.qty * oi.unit_price) DESC
    LIMIT ${limit}
  `;
}

export type CreateOrderInput = {
  customer_id: number;
  items: Array<{ product_id: number; qty: number }>;
};

export type CreateOrderResult = {
  order_id: number;
  customer_id: number;
  status: string;
  total: string;
  items: Array<{
    product_id: number;
    qty: number;
    unit_price: string;
  }>;
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult | null> {
  const customer = await sql`
    SELECT id FROM customers WHERE id = ${input.customer_id}
  `;
  if (customer.length === 0) return null;

  const productIds = input.items.map((item) => item.product_id);
  const products = await sql<{ id: number; price: string }[]>`
    SELECT id, price::text
    FROM products
    WHERE id = ANY(${productIds}::bigint[])
  `;
  if (products.length !== productIds.length) return null;

  const priceById = new Map(products.map((p) => [Number(p.id), p.price]));
  const lineItems = input.items.map((item) => {
    const unitPrice = priceById.get(item.product_id)!;
    return {
      product_id: item.product_id,
      qty: item.qty,
      unit_price: unitPrice,
      line_total: Number(unitPrice) * item.qty,
    };
  });
  const total = lineItems.reduce((sum, item) => sum + item.line_total, 0);

  const result = await sql.begin(async (tx) => {
    const orders = await tx<{ id: number }[]>`
      INSERT INTO orders (customer_id, status, total)
      VALUES (${input.customer_id}, 'paid', ${total})
      RETURNING id
    `;
    const orderId = orders[0]!.id;

    for (const item of lineItems) {
      await tx`
        INSERT INTO order_items (order_id, product_id, qty, unit_price)
        VALUES (${orderId}, ${item.product_id}, ${item.qty}, ${item.unit_price})
      `;
    }

    return {
      order_id: orderId,
      customer_id: input.customer_id,
      status: "paid",
      total: total.toFixed(2),
      items: lineItems.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
        unit_price: item.unit_price,
      })),
    } satisfies CreateOrderResult;
  });

  return result;
}
