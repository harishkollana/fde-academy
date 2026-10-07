// pandas and data files. Plan: docs/roadmap-v2/02-core-craft.md. One lesson per file in ./pandas/, wired in below.
import basics from './pandas/pandas-basics.js';
import groupbyWindow from './pandas/pandas-groupby-window.js';
import combine from './pandas/pandas-combine.js';
import datesText from './pandas/pandas-dates-text.js';
import cleaning from './pandas/pandas-cleaning.js';
import performance from './pandas/pandas-performance.js';
import parquetArrow from './pandas/pandas-parquet-arrow.js';
import excelOpenpyxl from './pandas/pandas-excel-openpyxl.js';
import validationTesting from './pandas/pandas-validation-testing.js';
import reconciliationLab from './pandas/pandas-reconciliation-lab.js';

export default {
  modules: [
    { id: 'pandas-mod-core', title: 'pandas core', lessons: [basics, groupbyWindow, combine, datesText, cleaning] },
    { id: 'pandas-mod-scale-formats', title: 'Scale and file formats', lessons: [performance, parquetArrow, excelOpenpyxl] },
    { id: 'pandas-mod-quality-lab', title: 'Quality and the lab', lessons: [validationTesting, reconciliationLab] },
  ],
};
