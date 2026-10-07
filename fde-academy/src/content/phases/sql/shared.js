// SQL shared by the performance lessons (sql-performance, sql-indexes-deep, sql-explain-deep, sql-partitioning-maintenance).
// The Kollana tables have 220 to 1,227 rows, so the planner never needs an index on them. These lessons build a bigger table.

// 1,00,000 journal lines (one lakh). Two lines per journal, three entities, the 15 real account ids, a posting date in FY 2025-26,
// and 1 line in 100 is 'Parked' (waiting for approval). Built with arithmetic only, so every run gives the same data.
export const GL_BIG = `CREATE TABLE gl_big AS
SELECT g AS line_id,
       (g + 1) / 2 AS journal_id,
       g % 3 + 1 AS entity_id,
       (ARRAY[1000,2000,4000,4100,4200,5000,5100,5200,6000,6100,6110,6120,6200,6300,6400])[g % 15 + 1] AS account_id,
       DATE '2025-04-01' + (g % 365) AS posting_date,
       ROUND(((g::bigint * 7919) % 100000) / 100.0, 2) AS amount,
       CASE WHEN g % 100 = 0 THEN 'Parked' ELSE 'Posted' END AS status
FROM generate_series(1, 100000) AS g;`;

// plan_nodes(sql): asks the planner for the plan (without running the query) and returns the node and index names in one line.
export const PLAN_NODES = `CREATE FUNCTION plan_nodes(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE j json;
BEGIN
  EXECUTE 'EXPLAIN (FORMAT JSON) ' || q INTO j;
  RETURN (SELECT string_agg(m[1], ' > ') FROM regexp_matches(j::text, '"(?:Node Type|Index Name)": "([^"]+)"', 'g') AS m);
END $$;`;

export const PERF_SETUP = `${GL_BIG}\n${PLAN_NODES}`;
