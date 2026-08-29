-- Electronics store schema for cache-aside demo.
-- Heavy table is order_items (~10M+ rows) used for slow aggregations.

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id          BIGSERIAL PRIMARY KEY,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  city        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  sku         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  brand       TEXT NOT NULL,
  category    TEXT NOT NULL,
  price       NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id           BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT NOT NULL,
  status       TEXT NOT NULL,
  total        NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT NOT NULL,
  product_id   BIGINT NOT NULL,
  qty          INTEGER NOT NULL CHECK (qty > 0),
  unit_price   NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0)
);

-- Secondary indexes are created after bulk load in the seed script.
