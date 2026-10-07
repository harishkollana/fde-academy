// REFERENCE EXAMPLE — this shows the quality bar and the exact format. Not loaded by the app.
export default {
  modules: [
    {
      id: 'example-module',
      title: 'Example module',
      lessons: [
        {
          id: 'example-left-join',
          title: 'LEFT JOIN: keep everything on the left',
          goal: 'You can use LEFT JOIN to keep every row from one table, and spot rows that have no match.',
          roadmap: ['INNER, LEFT, RIGHT, FULL OUTER'],
          blocks: [
            `## The problem
Your manager asks: "Show me **every customer** and how much they bought this year. Include customers who bought nothing."

An INNER JOIN would quietly drop the customers with no orders. That is a bug nobody notices until the CFO asks "where is Kite Media?".

A **LEFT JOIN** keeps every row from the left table. When there is no match on the right, the right side's columns become \`NULL\`.`,
            { sketch: { w: 760, h: 260, caption: 'LEFT JOIN keeps every customer; missing orders become NULL', items: [
              { t: 'table', x: 20, y: 50, title: 'customers (left)', cols: ['id', 'name'], colW: [50, 130], rows: [['1', 'Apex'], ['2', 'Blue Lotus'], ['11', 'Kite Media']] },
              { t: 'table', x: 270, y: 50, title: 'orders (right)', cols: ['cust', 'amount'], colW: [60, 90], rows: [['1', '5400'], ['2', '1800']] },
              { t: 'arrow', x1: 430, y1: 110, x2: 490, y2: 110, label: 'LEFT JOIN' },
              { t: 'table', x: 500, y: 50, title: 'result', cols: ['name', 'amount'], colW: [120, 90], rows: [['Apex', '5400'], ['Blue Lotus', '1800'], ['Kite Media', null]], hl: [2] },
              { t: 'note', x: 520, y: 200, w: 200, h: 44, text: 'no orders → NULL, but kept!' },
            ] } },
            { analogy: 'Think of a class attendance register (left) and the list of students who submitted homework (right). A LEFT JOIN prints **every student**, with a blank next to anyone who did not submit.' },
            `## The syntax
\`\`\`sql
SELECT c.customer_name, o.order_id, o.amount
FROM customers c                 -- left table: keep ALL rows
LEFT JOIN orders o               -- right table: only matching rows
  ON o.customer_id = c.customer_id;
\`\`\`
Read it as: "start from customers, and attach orders **if you can**."`,
            { sql: {
              starter: `SELECT c.customer_id, c.customer_name, o.order_id, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
ORDER BY c.customer_id DESC
LIMIT 10;`,
              note: 'Run it. Customers 11 and 12 have never ordered, so their order columns are NULL.',
            } },
            { warn: 'If you add `WHERE o.channel = \'Online\'` after a LEFT JOIN, the NULL rows fail that filter and disappear, so your LEFT JOIN silently becomes an INNER JOIN. Put conditions on the right table **inside the ON clause** instead.' },
            { widget: 'JoinVisualizer' },
            { challenge: {
              id: 'ex-ch-left-join',
              prompt: 'List **every customer** with their total order amount. Customers with no orders must show **0**. Return `customer_name, total_amount`.',
              hint: 'LEFT JOIN, then GROUP BY the customer, and wrap the SUM in COALESCE(…, 0).',
              solution: `SELECT c.customer_name, COALESCE(SUM(o.amount), 0) AS total_amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_name`,
            } },
            { interview: 'A classic question: "What is the difference between putting a filter in ON vs WHERE in a LEFT JOIN?" Answer: in ON it only limits which right rows can match (left rows stay); in WHERE it filters the final result (NULL rows get removed).' },
          ],
          quiz: [
            { q: 'A LEFT JOIN from customers to orders returns…', o: ['only customers with orders', 'every customer, matched to orders where possible', 'every order, even without a customer', 'only orders without customers'], a: 1, why: 'The left table is always fully kept.' },
            { q: 'For a customer with no orders, `o.amount` will be…', o: ['0', 'an empty string', 'NULL', 'an error'], a: 2, why: 'Unmatched right-side columns are filled with NULL, not 0.' },
            { q: 'Which query finds customers who **never** ordered?', o: ['INNER JOIN … WHERE o.order_id IS NULL', 'LEFT JOIN … WHERE o.order_id IS NULL', 'LEFT JOIN … WHERE o.order_id IS NOT NULL', 'CROSS JOIN orders'], a: 1, why: 'LEFT JOIN keeps them; the IS NULL filter keeps only the unmatched ones. This is called an anti-join.' },
            { q: 'You LEFT JOIN, then add `WHERE o.channel = \'Online\'`. What happens?', o: ['Nothing changes', 'Customers without orders disappear', 'Duplicates appear', 'It becomes a FULL JOIN'], a: 0 === 1 ? 0 : 1, why: 'NULL = \'Online\' is not true, so the unmatched rows are filtered out.' },
          ],
          task: {
            title: 'Run it on your own PostgreSQL',
            steps: [
              'Open DBeaver, connect to your practice database.',
              'Write a LEFT JOIN from dim_entity to fact_gl that counts GL lines per entity (include entities with zero lines).',
              'Save the query as `left_join_practice.sql` in your `sql-practice` Git repo and commit it.',
            ],
            deliverable: 'A committed .sql file with a comment explaining why LEFT JOIN was needed.',
          },
        },
      ],
    },
  ],
};
