export default {
  id: 'foundations-design-doc',
  title: 'Lab: write the design doc for the Finance Reporting Engine',
  goal: 'You can write a two-to-four page design doc for a data product, with requirements as numbers, an architecture diagram, failure modes, security, monitoring and decisions, and present it in five minutes.',
  roadmap: ['Design documents', 'End-to-end data product design', 'Presenting a system design'],
  blocks: [
    `## The problem
Your manager says: *"Automate the monthly P&L and budget-vs-actual for all three entities, with an exceptions report."* The tempting move is to open VS Code and start writing code.

The experienced move is to write a **design doc** first. A design doc is a short document (two to four pages) that answers: *what are we building, for whom, how, how will it fail, and what did we decide and why.* It is cheap to change (you edit words, not code), it lets other people find your mistakes before you build them, and it records decisions so that six months later nobody asks "why did we do it this way?"

It is also what interviewers test. "Design a pipeline for X" is a design doc spoken out loud in 45 minutes. This lab pulls together everything in Phase 0: the stages of a data product, OLTP and OLAP, medallion layers, quality and contracts, DNS, TLS and load balancing, identity and secrets, ACID and idempotency, caching, observability, file formats and storage choices. You will write the doc for **Project A, the Finance Reporting Automation Engine**, and the doc you produce becomes the README of that project.

## What goes in a design doc
Each section answers one question. If you cannot answer it, you have found a gap before it cost you anything.

| Section | The question it answers |
|---|---|
| **1. Context and goals** | Why are we doing this, and what does success look like? |
| **2. Non-goals** | What are we deliberately NOT doing? (Stops scope creep.) |
| **3. Users and requirements** | Who uses it, and what freshness, accuracy and access do they need, as **numbers**? |
| **4. Architecture** | What are the components and how does data flow? (With a diagram.) |
| **5. Data model** | What are the layers and key tables? |
| **6. Network and identity** | Who can reach what, and how do callers prove who they are? |
| **7. Security and PII** | What is sensitive, how is it protected, where do secrets live? |
| **8. Failure modes** | What breaks, how do we notice, what happens next? |
| **9. Monitoring and SLOs** | What do we measure and alert on? |
| **10. Cost** | What drives the bill, and what limits it? |
| **11. Risks and open questions** | What are we unsure about? Who decides? |
| **12. Decision log** | Which choices did we make, which alternatives did we reject, and why? |

Keep it to a few pages. Prefer tables and a diagram to paragraphs. Write requirements as testable numbers: not "fresh", but "the P&L is available by 10:00 IST on the third working day".`,
    { sketch: { w: 760, h: 430, caption: 'The Finance Reporting Engine end to end: six stages, plus orchestration, identity and network, and monitoring across all of them', items: [
      { t: 'doc', x: 8, y: 34, w: 96, h: 56, label: 'SAP GL\nexport', fill: 'yellow', size: 14 },
      { t: 'doc', x: 8, y: 104, w: 96, h: 56, label: 'Budget\n(Excel)', fill: 'yellow', size: 14 },
      { t: 'doc', x: 8, y: 174, w: 96, h: 56, label: 'FX rates\n(CSV)', fill: 'yellow', size: 14 },
      { t: 'box', x: 134, y: 74, w: 104, h: 112, label: 'Ingest', sub: 'validate', fill: 'orange', size: 17 },
      { t: 'box', x: 134, y: 222, w: 104, h: 52, label: 'Quarantine', sub: 'exceptions', fill: 'red', size: 15 },
      { t: 'box', x: 266, y: 74, w: 90, h: 112, label: 'BRONZE', sub: 'raw', fill: 'orange', size: 16 },
      { t: 'box', x: 384, y: 74, w: 90, h: 112, label: 'SILVER', sub: 'clean', fill: 'grey', size: 16 },
      { t: 'box', x: 502, y: 74, w: 90, h: 112, label: 'GOLD', sub: 'P&L, BvA', fill: 'yellow', size: 16 },
      { t: 'box', x: 620, y: 74, w: 130, h: 112, label: 'Serve', sub: 'Excel MIS pack\nPower BI', fill: 'green', size: 17 },
      { t: 'arrow', x1: 104, y1: 62, x2: 134, y2: 100 },
      { t: 'arrow', x1: 104, y1: 132, x2: 134, y2: 130 },
      { t: 'arrow', x1: 104, y1: 202, x2: 134, y2: 160 },
      { t: 'arrow', x1: 238, y1: 130, x2: 266, y2: 130 },
      { t: 'arrow', x1: 356, y1: 130, x2: 384, y2: 130 },
      { t: 'arrow', x1: 474, y1: 130, x2: 502, y2: 130 },
      { t: 'arrow', x1: 592, y1: 130, x2: 620, y2: 130 },
      { t: 'arrow', x1: 186, y1: 186, x2: 186, y2: 222, color: '#e03131', dashed: true },
      { t: 'note', x: 266, y: 218, w: 330, h: 58, text: 'Rules: debits = credits per journal, account exists,\nFX rate exists, no duplicate lines. Bad rows go to quarantine.', fill: 'pink', size: 14 },
      { t: 'person', x: 686, y: 214, label: 'CFO, FP&A' },
      { t: 'box', x: 8, y: 298, w: 744, h: 34, label: 'Orchestration: a scheduler runs the steps in order, retries, alerts on failure', fill: 'teal', size: 15 },
      { t: 'box', x: 8, y: 340, w: 744, h: 34, label: 'Identity and network: managed identity, secrets in Key Vault, private database, TLS everywhere', fill: 'pink', size: 15 },
      { t: 'box', x: 8, y: 382, w: 744, h: 34, label: 'Monitoring: freshness, row counts, balance checks, cost budget, audit log', fill: 'grey', size: 15 },
    ] } },
    `## A worked example
Below is a complete design doc for the Kollana Tech engine. Read it once as a model. Notice how each requirement is a number, each failure has a mitigation, and each decision names the alternative that was rejected. The numbers about the data are real: you will reproduce them in the SQL playground next.

\`\`\`markdown
# Design: Finance Reporting Automation Engine (Kollana Tech)
Author: Asha · Status: draft · Reviewers: Finance Controller, IT security

## 1. Context and goals
Finance spends several days each month assembling the P&L and budget-vs-actual for three
entities (IN01, SG01, US01) from SAP exports and Excel. Errors are found late. Goal: one
command produces a validated P&L, budget-vs-actual and an exceptions report for FY 2025-26.
Success = P&L pack ready by 10:00 IST on the 3rd working day, with zero silent data loss.

## 2. Non-goals
Forecasting. Real-time reporting. Replacing SAP. Handling more than three entities.

## 3. Users and requirements
Users: CFO and FP&A (read the pack), Finance Controller (resolves exceptions).
- Freshness: previous month closed and published by 10:00 IST on working day 3.
- Accuracy: totals reconcile to the SAP export to the paisa; unbalanced journals never
  reach the P&L (today: 4 of 612 journals are unbalanced).
- Access: salaries visible to Finance only; the pack is read-only for everyone else.

## 4. Architecture
Sources -> Ingest (validate) -> Bronze (raw) -> Silver (clean) -> Gold (P&L, BvA) -> Excel
pack and Power BI. Quarantine table for rejected rows. A scheduler runs the steps.

## 5. Data model
Bronze: gl_raw, budget_raw, fx_raw (append-only, with load_id and source_file).
Silver: fact_gl, fact_budget, fx_rates, dim_account (3-level hierarchy), dim_entity.
Gold: v_pnl (entity, month, account group), v_budget_vs_actual. Grain of fact_gl = one line.

## 6. Network and identity
PostgreSQL in a private subnet, no public address. The job runs with a managed identity;
no password in code. Users reach Power BI through single sign-on (OIDC); roles: viewer,
controller, admin.

## 7. Security and PII
PAN and bank accounts are not loaded into the reporting schema. Salaries masked unless
role = controller. Secrets in Key Vault. TLS in transit, encryption at rest. Audit log of
every exception resolved and every pack published.

## 8. Failure modes
| Failure | Detect | Response |
| Source column renamed | schema check at ingest | reject file, alert owner |
| Same file sent twice | file hash in load_log | skip, log "duplicate" |
| Unbalanced journal | balance rule | quarantine, report to controller |
| FX rate missing (SGD Feb 2026) | FX rule | quarantine lines, block restatement |
| Job crashes half-way | load_log status | re-run is idempotent (upsert by key) |

## 9. Monitoring and SLOs
SLO: pack published on time in 95% of months. Alerts: no load by 08:00, row count outside
+/-20% of last month, any quarantined rows, pack not built by 09:30. Runbook per alert.

## 10. Cost
Small PostgreSQL instance and a scheduler; set a monthly budget alert and review quarterly.

## 11. Risks and open questions
SAP export format may change (owner: Finance Systems). Constant-currency policy to confirm
with the CFO.

## 12. Decision log
D1 PostgreSQL over Excel macros: testable, versioned. Rejected: keep Excel (no audit trail).
D2 Batch monthly, not streaming: freshness need is days, not seconds.
D3 Quarantine bad rows, never auto-fix: errors belong to the source owner.
\`\`\``,
    { sql: {
      title: 'The real numbers behind the doc',
      starter: `-- How big is the data, and what is wrong with it? (These are the figures quoted in the design doc.)
SELECT 'fact_gl lines' AS item, COUNT(*)::text AS value FROM fact_gl
UNION ALL SELECT 'journals', COUNT(DISTINCT journal_id)::text FROM fact_gl
UNION ALL SELECT 'first posting', MIN(posting_date)::text FROM fact_gl
UNION ALL SELECT 'last posting', MAX(posting_date)::text FROM fact_gl
UNION ALL SELECT 'unbalanced journals', COUNT(*)::text
  FROM (SELECT journal_id FROM fact_gl GROUP BY journal_id HAVING ABS(SUM(debit) - SUM(credit)) > 0.005) j
UNION ALL SELECT 'duplicated line groups', COUNT(*)::text
  FROM (SELECT 1 FROM fact_gl GROUP BY journal_id, account_id, posting_date, debit, credit HAVING COUNT(*) > 1) d;

-- Which foreign-currency months have no FX rate? (a failure-mode row in section 8)
SELECT e.currency, m.month::date AS month_without_rate
FROM dim_entity e
CROSS JOIN generate_series(date '2025-04-01', date '2026-03-01', interval '1 month') AS m(month)
WHERE e.currency <> 'INR'
  AND NOT EXISTS (SELECT 1 FROM fx_rates f WHERE f.currency = e.currency AND f.rate_month = m.month::date)
ORDER BY 1, 2;`,
      note: 'Every claim in section 3 and section 8 of the worked doc comes from this query. A design doc that quotes real numbers is far more convincing than one that says "some data is bad".',
    } },
    { challenge: {
      id: 'foundations-ch-unbalanced-by-entity',
      level: 'medium',
      prompt: 'Section 3 says some journals do not balance. Which entities are affected? Return `entity_code` and `unbalanced_journals` (the number of journals whose debits differ from credits by more than 0.005) for entities that have **at least one**. Order does not matter.',
      hint: 'Group fact_gl by journal_id and entity_id with HAVING on the absolute difference of the sums, then join dim_entity and count per entity_code.',
      solution: `SELECT e.entity_code, COUNT(*) AS unbalanced_journals
FROM (
  SELECT journal_id, entity_id
  FROM fact_gl
  GROUP BY journal_id, entity_id
  HAVING ABS(SUM(debit) - SUM(credit)) > 0.005
) j
JOIN dim_entity e ON e.entity_id = j.entity_id
GROUP BY e.entity_code`,
    } },
    `## Check your doc with a linter
Teams often add a tiny script to check that every required section exists before a doc goes for review. The program below does that for a deliberately incomplete doc.`,
    { py: {
      title: 'A design-doc linter',
      starter: `import re

REQUIRED = ["Context and goals", "Non-goals", "Users and requirements", "Architecture", "Data model",
            "Network and identity", "Security and PII", "Failure modes", "Monitoring and SLOs",
            "Cost", "Risks and open questions", "Decision log"]

doc = """# Design: Finance Reporting Engine
## 1. Context and goals
Finance spends days assembling the P&L.
## 2. Non-goals
No forecasting.
## 4. Architecture
Sources -> ingest -> bronze -> silver -> gold.
## 8. Failure modes
Source column renamed -> reject the file.
## 12. Decision log
D1 PostgreSQL over Excel macros.
"""

def headings(text):
    found = set()
    for line in text.splitlines():
        m = re.match(r"^#{1,3}\\s+(.*)$", line)
        if m:
            found.add(re.sub(r"^\\d+[.)]?\\s*", "", m.group(1)).strip().lower())   # drop "4. " numbering
    return found

have = headings(doc)
for name in REQUIRED:
    print(("OK      " if name.lower() in have else "MISSING ") + name)
print(f"{sum(n.lower() in have for n in REQUIRED)} of {len(REQUIRED)} sections present")`,
      note: 'Add the missing headings and run again. A linter cannot judge whether a section is good, only whether you remembered it.',
    } },
    { pychallenge: {
      id: 'foundations-pych-missing-sections',
      prompt: 'Write `missing_sections(doc, required)` that returns the list of `required` section names that do **not** appear as a markdown heading in `doc`, keeping the order of `required`. A heading is a line that starts with `#`, `##` or `###` (one to three hashes) followed by a space and the text. Compare **case-insensitively** and ignore leading numbering such as `4.` or `4)`. Lines with four or more hashes, or with `##` in the middle of a line, are not headings.',
      starter: `import re

def missing_sections(doc, required):
    return []`,
      tests: `doc = """# Design: Finance engine
## 1. Context and goals
text
## Non-goals
### Architecture
#### Cost
Not a heading: ## Data model
## SECURITY AND PII
"""
required = ["Context and goals", "Non-goals", "Architecture", "Data model", "Cost", "Security and PII"]
assert missing_sections(doc, required) == ["Data model", "Cost"]
assert missing_sections(doc, []) == []
assert missing_sections("", ["Architecture"]) == ["Architecture"]
assert missing_sections("## 3) Failure modes", ["Failure modes"]) == []`,
      solution: `import re

def missing_sections(doc, required):
    found = set()
    for line in doc.splitlines():
        m = re.match(r"^#{1,3}\\s+(.*)$", line)
        if m:
            found.add(re.sub(r"^\\d+[.)]?\\s*", "", m.group(1)).strip().lower())
    return [r for r in required if r.strip().lower() not in found]`,
      hint: 'Collect the cleaned heading texts into a set (lower-case, numbering removed), then filter `required` with a list comprehension.',
    } },
    `## A 12-point self-review
Before you show the doc to anyone, check it against this list. If you cannot tick an item, that is the next thing to fix.`,
    { checklist: [
      'The goal is one or two sentences and success is a **number** (a time, a percentage, a count).',
      'Non-goals are written, so scope cannot quietly grow.',
      'Every requirement is **testable**: freshness, accuracy, access, availability.',
      'There is a **diagram** and the data flows left to right with every arrow labelled or obvious.',
      'The data layers (bronze, silver, gold) and the **grain** of the main fact table are stated.',
      'It says how the system is reached: **network** (public or private) and **identity** (who proves what).',
      'Sensitive data (PAN, bank accounts, salaries) is listed, with how it is minimised, masked and logged.',
      'No secret appears in the doc or is planned for code; the doc says where secrets live.',
      'There is a **failure-mode table** with at least five rows and a detection and response for each.',
      'Re-running after a crash is **idempotent**, and the doc says how.',
      'There are monitors with thresholds, an owner for each alert, and an SLO.',
      'Decisions are logged with the **rejected alternative** and the reason.',
    ] },
    `## Presenting it in five minutes
In an interview or a review you will not read the doc; you will talk through it. A simple order that works every time:
1. **Clarify first** (about a minute). Ask who the users are, how fresh the data must be, how big it is, what is sensitive. Say the answers back as numbers.
2. **Draw the six stages** (about a minute and a half), left to right: sources, ingest, store, transform, serve, monitor, then the three cross-cutting layers.
3. **Zoom into the hard parts** (about a minute and a half): where quality is enforced, how a re-run stays safe, how identity and network are set.
4. **Walk the failure table** (about a minute): pick two failures and say how you would notice and what happens next.
5. **Name the trade-offs and the next step** (about thirty seconds): "batch over streaming because the need is days; if CFO wants intraday we would add micro-batches."

Always say *why*, never only *what*. "I chose batch because freshness is measured in days and batch is simpler to run and re-run" is worth ten tool names.`,
    { warn: 'A design doc is a thinking tool, not paperwork. Do not write it **after** the code to justify it, and do not make it so long that nobody reads it. Two to four pages, a diagram, tables, and every decision with its rejected alternative. If a section has nothing to say, write "not applicable, because …" rather than deleting it.' },
    { interview: '**"Design a pipeline that produces a monthly P&L for a group with three entities."** Model answer: "First I would clarify: who reads it, how fresh it must be, and what the ledger volume is. Then six stages: SAP exports land in a bronze layer unchanged; an ingest step checks schema and business rules (debits equal credits per journal, accounts exist, FX rate exists) and sends bad rows to a quarantine table with a report; silver holds cleaned, typed facts and dimensions with the account hierarchy; gold views give the P&L and budget vs actual; an Excel pack and Power BI serve it. A scheduler runs the steps and retries, loads are idempotent by key, the job uses a managed identity with the database in a private subnet, and I monitor freshness, row counts and balance checks with alerts to a named owner. I chose batch over streaming because freshness is measured in days." Close with one failure you would test first.' },
    { real: 'Next time you are handed "automate this report", spend an hour on a one-page version of this doc before you build. Send it to the Finance Controller and ask for the three numbers you do not have yet (freshness, accuracy tolerance, who may see what). The doc turns a vague request into agreed requirements, and it is the fastest way to earn a customer\'s trust as an FDE.' },
    `## Recap
- A **design doc** answers: what, for whom, how, how it fails, and what we decided. It is cheap to change, finds mistakes early and records decisions.
- Twelve sections: context and goals, non-goals, requirements as **numbers**, architecture with a diagram, data model, network and identity, security and PII, failure modes, monitoring and SLOs, cost, risks, and a decision log with **rejected alternatives**.
- Quote **real numbers** from the data (here: 1,227 GL lines, 612 journals, 4 unbalanced, a missing SGD rate for February 2026).
- Present in order: clarify, six stages, hard parts, failure table, trade-offs. Always say why.
- This is Phase 0 done: you now have the map every later phase hangs on. Your doc becomes the README of Project A.`,
  ],
  quiz: [
    { q: 'Which requirement is written the way a design doc should write it?', o: ['The report should be fresh', 'The data should be accurate', 'The P&L is published by 10:00 IST on the third working day', 'The system must be fast and secure'], a: 2, why: 'A good requirement is testable: it has a number, a time or a threshold.' },
    { q: 'What is the main purpose of a Non-goals section?', o: ['To make the document longer', 'To stop scope from quietly growing by stating what is deliberately out', 'To list bugs', 'To record the budget'], a: 1, why: 'Saying what you will not do prevents "while you are at it" requests from derailing the design.' },
    { q: 'In the worked doc, a bad row is quarantined and never fixed automatically. Why?', o: ['It is faster', 'Fixing it silently would hide the root cause; the source owner should correct it', 'Because SQL cannot update rows', 'Because quarantine is required by law'], a: 1, why: 'Silent fixes create numbers nobody can reproduce and let the real problem continue at the source.' },
    { q: 'Why does the doc choose batch processing over streaming?', o: ['Streaming is not possible in Azure', 'Batch is always better', 'The freshness need is days, so the simpler design is enough', 'Because streaming is slower'], a: 2, why: 'You choose the simplest design that meets the stated freshness requirement, and say why.' },
    { q: 'What makes a decision-log entry useful?', o: ['It names the decision, the rejected alternative and the reason', 'It names only the tool', 'It has no reasons, to save space', 'It is written after the project ends'], a: 0, why: 'Future readers need to know what was considered and why, so they do not repeat the argument.' },
    { q: 'Which opening move is strongest when asked to "design a pipeline" in an interview?', o: ['Draw boxes immediately', 'Ask clarifying questions and restate the answers as numbers', 'List every tool you know', 'Say it depends and stop'], a: 1, why: 'Clarifying users, freshness, volume and sensitivity shows you design for requirements, not for tools.' },
  ],
  task: {
    title: 'Write your own design doc',
    steps: [
      'Choose one real automation or report from your job (no client names). Write its design doc using the 12 headings above, in a file called `DESIGN.md` in your Project A repository folder.',
      'Include a diagram (draw.io or paper photo), at least five rows in the failure-mode table, one SLO, and three decision-log entries each with a rejected alternative.',
      'Paste your doc into the linter playground and make sure no section is missing. Then tick every item of the 12-point self-review honestly.',
      'Explain the doc aloud in five minutes to a friend or to your phone recorder, in the order given above. Listen back and note where you said what but not why.',
    ],
    deliverable: 'DESIGN.md in your Project A folder, a diagram, the linter output with no MISSING lines, and your self-review ticks. This file becomes the README of Project A.',
  },
};
