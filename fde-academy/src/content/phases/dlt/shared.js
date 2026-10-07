// Shared SQL setup snippets for the ingestion and transformation stage (pure data).
// BRONZE_SETUP builds a realistic "bronze" table the way dlt would land ERP CSV drops:
// every column is text, dates in two formats, lowercase SKUs, channels with trailing spaces,
// amounts with thousands separators, blank status, plus 22 re-sent rows (a later load) with
// updated status. 242 bronze rows -> 220 unique orders.
export const BRONZE_SETUP = `CREATE SCHEMA bronze;
CREATE TABLE bronze.orders_raw (
  order_id text, order_date text, customer_id text, sku text, qty text,
  channel text, amount text, status text,
  _source_file text, _dlt_load_id text, _dlt_id text
);
INSERT INTO bronze.orders_raw
SELECT o.order_id::text,
       CASE WHEN o.order_id % 4 = 0 THEN to_char(o.order_date, 'DD/MM/YYYY')
            ELSE to_char(o.order_date, 'YYYY-MM-DD') END,
       o.customer_id::text,
       CASE WHEN o.order_id % 5 = 0 THEN lower(p.sku) ELSE p.sku END,
       o.qty::text,
       CASE WHEN o.order_id % 6 = 0 THEN lower(o.channel) || ' ' ELSE o.channel END,
       CASE WHEN o.amount >= 100000 THEN to_char(o.amount, 'FM999,999,990.00') ELSE o.amount::text END,
       COALESCE(o.status, ''),
       'orders_' || to_char(o.order_date, 'YYYY-MM-DD') || '.csv',
       extract(epoch FROM o.order_date + 1)::bigint::text || '.000001',
       substr(md5('a' || o.order_id), 1, 14)
FROM orders o JOIN products p ON p.product_id = o.product_id;
INSERT INTO bronze.orders_raw
SELECT order_id, order_date, customer_id, sku, qty, channel, amount,
       CASE WHEN status = 'Shipped' THEN 'Delivered' ELSE status END,
       'orders_resend.csv',
       (split_part(_dlt_load_id, '.', 1)::bigint + 7 * 86400)::text || '.000001',
       substr(md5('b' || order_id), 1, 14)
FROM bronze.orders_raw
WHERE order_id::int % 10 = 0;
`;

// The silver staging model (what dbt would build from bronze) as a view.
export const STG_ORDERS_SQL = `WITH source AS (
  SELECT * FROM bronze.orders_raw
), renamed AS (
  SELECT
    order_id::int                                AS order_id,
    CASE WHEN order_date ~ '^\\d{2}/\\d{2}/\\d{4}$'
         THEN to_date(order_date, 'DD/MM/YYYY')
         ELSE order_date::date END               AS order_date,
    customer_id::int                             AS customer_id,
    upper(trim(sku))                             AS sku,
    qty::int                                     AS qty,
    initcap(trim(channel))                       AS channel,
    replace(amount, ',', '')::numeric(12,2)      AS amount,
    NULLIF(status, '')                           AS status,
    _dlt_load_id
  FROM source
), deduped AS (
  SELECT *,
         row_number() OVER (PARTITION BY order_id ORDER BY _dlt_load_id DESC) AS rn
  FROM renamed
)
SELECT order_id, order_date, customer_id, sku, qty, channel, amount, status, _dlt_load_id
FROM deduped
WHERE rn = 1`;

export const SILVER_SETUP = `${BRONZE_SETUP}
CREATE SCHEMA silver;
CREATE VIEW silver.stg_erp__orders AS
${STG_ORDERS_SQL};
CREATE VIEW silver.stg_erp__products AS
SELECT product_id, upper(trim(sku)) AS sku, product_name, category, unit_price::numeric(12,2) AS list_price
FROM products;
CREATE VIEW silver.stg_erp__customers AS
SELECT customer_id, trim(customer_name) AS customer_name, city, segment, signup_date
FROM customers;
`;
