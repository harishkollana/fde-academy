// SQL (PostgreSQL). Plan: docs/roadmap-v2/02-core-craft.md. One lesson per file in ./sql/, wired in below.
import setup from './sql/sql-setup.js';
import select from './sql/sql-select.js';
import operators from './sql/sql-operators.js';
import nulls from './sql/sql-nulls.js';
import caseCast from './sql/sql-case-cast.js';
import aggregates from './sql/sql-aggregates.js';
import conditionalAgg from './sql/sql-conditional-agg.js';
import rollup from './sql/sql-rollup.js';
import joins from './sql/sql-joins.js';
import joinsAdvanced from './sql/sql-joins-advanced.js';
import subqueries from './sql/sql-subqueries.js';
import ctes from './sql/sql-ctes.js';
import windowRanking from './sql/sql-window-ranking.js';
import windowAnalytics from './sql/sql-window-analytics.js';
import dates from './sql/sql-dates.js';
import stringsRegex from './sql/sql-strings-regex.js';
import jsonArrays from './sql/sql-json-arrays.js';
import setOps from './sql/sql-set-ops.js';
import reconciliation from './sql/sql-reconciliation.js';
import dml from './sql/sql-dml.js';
import upsertMerge from './sql/sql-upsert-merge.js';
import transactionsIsolation from './sql/sql-transactions-isolation.js';
import locksDeadlocks from './sql/sql-locks-deadlocks.js';
import ddl from './sql/sql-ddl.js';
import modelling from './sql/sql-modelling.js';
import functionsProcedures from './sql/sql-functions-procedures.js';
import rolesSecurity from './sql/sql-roles-security.js';
import opsBackup from './sql/sql-ops-backup.js';
import perf from './sql/sql-performance.js';
import indexesDeep from './sql/sql-indexes-deep.js';
import explainDeep from './sql/sql-explain-deep.js';
import partitioning from './sql/sql-partitioning-maintenance.js';
import incrementalLoads from './sql/sql-incremental-loads.js';
import scd2 from './sql/sql-scd2.js';
import advancedPatterns from './sql/sql-advanced-patterns.js';
import dataQuality from './sql/sql-data-quality.js';
import dialects from './sql/sql-dialects.js';
import interviewMethod from './sql/sql-interview-method.js';

export default {
  modules: [
    { id: 'sql-mod-foundations', title: 'SQL foundations', lessons: [setup, select, operators, nulls, caseCast] },
    { id: 'sql-mod-summarising', title: 'Summarising data', lessons: [aggregates, conditionalAgg, rollup] },
    { id: 'sql-mod-joins', title: 'Joining tables', lessons: [joins, joinsAdvanced] },
    { id: 'sql-mod-subqueries', title: 'Subqueries and CTEs', lessons: [subqueries, ctes] },
    { id: 'sql-mod-windows', title: 'Window functions', lessons: [windowRanking, windowAnalytics] },
    { id: 'sql-mod-dates-text-json', title: 'Dates, text and JSON', lessons: [dates, stringsRegex, jsonArrays] },
    { id: 'sql-mod-sets-reconciliation', title: 'Sets and reconciliation', lessons: [setOps, reconciliation] },
    { id: 'sql-mod-changing-data', title: 'Changing data safely', lessons: [dml, upsertMerge, transactionsIsolation, locksDeadlocks] },
    { id: 'sql-mod-designing', title: 'Designing databases', lessons: [ddl, modelling] },
    { id: 'sql-mod-programmability', title: 'Programmability, security and operations', lessons: [functionsProcedures, rolesSecurity, opsBackup] },
    { id: 'sql-mod-performance', title: 'Performance', lessons: [perf, indexesDeep, explainDeep, partitioning] },
    { id: 'sql-mod-data-engineering', title: 'Data-engineering SQL patterns', lessons: [incrementalLoads, scd2, advancedPatterns, dataQuality] },
    { id: 'sql-mod-dialects-interviews', title: 'Dialects and interviews', lessons: [dialects, interviewMethod] },
  ],
};
