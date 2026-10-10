// MBA Semester 1 data. Pure data, no React.
// Sources (D:\Ed\MBA\1st Sem): "Academic Calendar_Sem 1.pdf", "Amity- Assessment_schema_PG_and_UG_-Jan-2025 Onwards.pdf"
// and the five subject PDFs (module titles and page numbers come from each PDF's contents page).

export const PROGRAMME = {
  name: 'MBA',
  university: 'Amity University Online',
  semester: 'Semester 1',
  semShort: '1st Sem',
  session: 'July 2026 session',
};

// The four semesters shown in the switches. `ready` is true once that semester's calendar and files have been added.
export const SEMESTERS = [
  { n: 1, short: '1st Sem', name: 'Semester 1', ready: true },
  { n: 2, short: '2nd Sem', name: 'Semester 2', ready: false },
  { n: 3, short: '3rd Sem', name: 'Semester 3', ready: false },
  { n: 4, short: '4th Sem', name: 'Semester 4', ready: false },
];

export const CALENDAR_NOTE = 'All dates are subject to change. Any change is announced in the student zone of the learning system (AMIGO), where all online session links are also available.';

// kind decides the label and colour on the page.
export const KINDS = {
  session: { label: 'Session', ico: '🎓' },
  orientation: { label: 'Orientation', ico: '🧭' },
  class: { label: 'Classes', ico: '🧑‍🏫' },
  milestone: { label: 'Assignment', ico: '📝' },
  exam: { label: 'Exam', ico: '🧪' },
  career: { label: 'Career', ico: '💼' },
};

// start / end are yyyy-mm-dd. `end` is only there when the calendar gives a start date and an end date.
export const CALENDAR = [
  { id: 'accr', title: 'Advanced Certificate in Career Readiness Sessions (ACCR)', start: '2026-06-03', end: '2026-07-10', kind: 'career' },
  { id: 'session-start', title: 'Commencement of Academic Session', start: '2026-07-13', kind: 'session' },
  { id: 'orientation-1', title: 'Program Orientation Phase I (Virtual)', start: '2026-07-16', end: '2026-07-19', kind: 'orientation' },
  { id: 'live-classes-1', title: 'Commencement of Virtual Live Classes', start: '2026-07-20', kind: 'class' },
  { id: 'orientation-2', title: 'Program Orientation Phase II (Virtual)', start: '2026-10-01', end: '2026-10-04', kind: 'orientation' },
  { id: 'live-classes-2', title: 'Commencement of Virtual Live Classes Phase II', start: '2026-10-05', kind: 'class' },
  { id: 'samagam', title: 'SAMAGAM Offline Orientation', start: '2026-10-10', kind: 'orientation' },
  { id: 'milestone-1', title: 'Milestone 1: Assignment 1 (Module 1 Assessment)', start: '2026-10-21', kind: 'milestone' },
  { id: 'milestone-2', title: 'Milestone 2: Assignment 1 (Module 2 Assessment)', start: '2026-10-30', kind: 'milestone' },
  { id: 'milestone-3', title: 'Milestone 3: Assignment 1 (Module 3 Assessment)', start: '2026-11-10', kind: 'milestone' },
  { id: 'milestone-4', title: 'Milestone 4: Assignment 1 (Module 4 Assessment)', start: '2026-11-20', kind: 'milestone' },
  { id: 'milestone-5', title: 'Milestone 5: Assignment 1 (Module 5 Assessment)', start: '2026-11-30', kind: 'milestone' },
  { id: 'milestone-6', title: 'Milestone 6: Completion of Assignment 2 (Case Study)', start: '2026-12-10', kind: 'milestone' },
  { id: 'ete-notice', title: 'Notification of End-Term Examination', start: '2026-12-14', kind: 'exam' },
  { id: 'ete-webinar', title: 'Webinar on End-Term Examination', start: '2026-12-18', kind: 'exam' },
  { id: 'admit-card', title: 'Admit Card Generation (Slot Booking)', start: '2026-12-21', kind: 'exam' },
  { id: 'last-submit', title: 'Last date for Submission of Assignments', start: '2026-12-21', kind: 'milestone' },
  { id: 'lmr', title: 'Last Minute Revision Virtual Session (LMR)', start: '2026-12-28', end: '2027-01-05', kind: 'class' },
  { id: 'mock', title: 'ETE Mock Test Week', start: '2027-01-04', kind: 'exam' },
  { id: 'doubt', title: 'On-Campus Doubt Clearing Sessions', start: '2027-01-07', end: '2027-01-10', kind: 'class' },
  { id: 'ete', title: 'Semester End Term Examination, including Practical/Lab Examination', start: '2027-01-12', end: '2027-01-31', kind: 'exam' },
  { id: 'result', title: 'Result Declaration of ETE', start: '2027-03-01', kind: 'exam' },
];

export const ASSESSMENT = {
  source: 'Amity University Online assessment schema (batches from January 2025 onwards)',
  split: [
    { label: 'Internal', pct: 30, sub: 'Assignments (module assessments + case study)' },
    { label: 'External', pct: 70, sub: 'End Term Examination (ETE)' },
  ],
  passing: [
    { category: 'Internal', type: 'Module assessments', max: 30, passPct: '50%', passScore: 15 },
    { category: 'External', type: 'Final semester End Term Examination', max: 70, passPct: '40%', passScore: 28 },
    { category: 'Overall', type: 'Internal + External', max: 100, passPct: '45%', passScore: 45 },
  ],
  internal: [
    'Each subject has five modules, and each module has its own Module Assessment. The five Module Assessments together are Assignment 1.',
    'Assignment 2 is open from the first day of course access until the submission deadline. You can attempt it at any time, but finish Assignment 1 first for a better result.',
    'Each attempt lasts 60 minutes. You get the best of 3 attempts, and the pass mark is 50%.',
    'The next module opens when every activity in the module is done and you have scored at least 50% or used all 3 attempts.',
    'You study at your own pace and can complete the work any time before the submission deadline.',
  ],
  ete: {
    intro: 'The ETE is held twice a year through a proctored examination system, and dates are announced one month before it starts.',
    sections: [
      { section: 'A', type: 'Subjective: essay type', questions: 'Attempt 2 out of 4', each: '7.5 marks', total: 15 },
      { section: 'B', type: 'Subjective: case study type', questions: 'Attempt all 2', each: '7.5 marks', total: 15 },
      { section: 'C', type: 'Multiple choice (MCQ)', questions: '20 questions', each: '2 marks', total: 40 },
    ],
    totalMarks: 70,
  },
  rules: [
    'To pass a course you need at least 40% in the ETE and at least 50% in the internal assessment.',
    'On top of that, you need an overall aggregate of at least 45% across internal and ETE marks.',
    'Supplementary examinations are held after the End Term Examinations, as per the notified schedule.',
    'For the postgraduate (PG) programme you need an SGPA of at least 5.0 in every semester and a CGPA of at least 6.0 to complete the programme.',
  ],
};

// Module titles, section titles, lesson titles and the book page each one starts on are copied from each subject's contents page
// (module and lesson pages were checked against the page numbers printed in the PDFs). `no` is the number the book prints, e.g. 2.4.2.
export const SUBJECTS = [
  {
    id: 'accounting-for-managers', title: 'Accounting for Managers', ico: '🧾',
    file: 'Accounting For Managers.pdf', pdfPages: 217,
    modules: [
      {
        title: 'Introduction to Financial Accounting', page: 1,
        sections: [
          { no: '1.1', title: 'Financial Accounting Introduction', lessons: [
            { no: '1.1.1', title: 'Financial Accounting: Meaning and Functions', page: 2 },
            { no: '1.1.2', title: 'The Role of Accounting in Business', page: 3 },
            { no: '1.1.3', title: 'Branches or Types of Accounting', page: 3 },
            { no: '1.1.4', title: 'Basic Accounting Terminology', page: 5 },
            { no: '1.1.5', title: 'Concepts and Conventions of Accounting with Example: Part 1', page: 6 },
            { no: '1.1.6', title: 'Concepts and Conventions of Accounting with Example: Part 2', page: 10 },
            { no: '1.1.7', title: 'Indian Accounting Standard, US GAAP and IFRS: Overview Only', page: 16 },
            { no: '1.1.8', title: 'Accounting Cycle', page: 18 },
          ] },
          { no: '1.2', title: 'Recording of Transaction', lessons: [
            { no: '1.2.1', title: 'Accounting Equation: Part 1', page: 19 },
            { no: '1.2.2', title: 'Accounting Equation: Part 2', page: 22 },
            { no: '1.2.3', title: 'Recording of Transactions & Rule of Debit & Credit', page: 25 },
            { no: '1.2.4', title: 'Journal Entry With Example', page: 28 },
            { no: '1.2.5', title: 'Ledger Posting with Example', page: 32 },
            { no: '1.2.6', title: 'Illustration/Numerical on Journal Entry & Ledger Posting', page: 35 },
            { no: '1.2.7', title: 'Subsidiary Books', page: 38 },
            { no: '1.2.8', title: 'Trial Balance: Meaning, Benefit and Format', page: 39 },
            { no: '1.2.9', title: 'Preparation of Trial Balance', page: 40 },
          ] },
        ],
      },
      {
        title: 'Preparation of Financial Statements', page: 51,
        sections: [
          { no: '2.1', title: 'Financial Statements', lessons: [
            { no: '2.1.1', title: 'Financial Statements – Meaning, Characteristics etc', page: 52 },
            { no: '2.1.2', title: 'Financial Statements: Components and Its Users', page: 53 },
          ] },
          { no: '2.2', title: 'Income Statement', lessons: [
            { no: '2.2.1', title: 'Income Statement Part 1: Recording Revenue', page: 55 },
            { no: '2.2.2', title: 'Income Statement Part 2 – Recording Cost of Goods Sold', page: 57 },
            { no: '2.2.3', title: 'Income Statement Part 3 – Recording Operating Expenses', page: 59 },
            { no: '2.2.4', title: 'Income Statement: PAT', page: 60 },
            { no: '2.2.5', title: 'Dividends and Earning Per Share', page: 61 },
            { no: '2.2.6', title: 'Income Statement as per Indian Companies Act 2013 Revised Schedule III: Case Study ITC', page: 62 },
          ] },
          { no: '2.3', title: 'Balance Sheet', lessons: [
            { no: '2.3.1', title: 'Balance Sheet Part 1 – Recording Long Term Liabilities', page: 64 },
            { no: '2.3.2', title: 'Balance Sheet Part 2 – Recording Long Term Assets', page: 68 },
            { no: '2.3.3', title: 'Balance Sheet Part-3 Recording Investments', page: 72 },
            { no: '2.3.4', title: 'Balance Sheet Part 4 – Recording Working Capital Management', page: 75 },
            { no: '2.3.5', title: 'Balance Sheet as per Indian Companies Act 2013 Revised Schedule III: Case Study ITC', page: 79 },
          ] },
          { no: '2.4', title: 'Depreciation', lessons: [
            { no: '2.4.1', title: 'Introduction to Depreciation', page: 81 },
            { no: '2.4.2', title: 'Depreciation – Straight Line Method', page: 81 },
            { no: '2.4.3', title: 'Depreciation – Annuity and Unit of Production Method', page: 83 },
            { no: '2.4.4', title: 'Depreciation – Sinking Fund and Depletion Method', page: 84 },
            { no: '2.4.5', title: 'Depreciation – Change in Rate and Useful Life', page: 87 },
            { no: '2.4.6', title: 'Statement of Changes in Equity', page: 92 },
          ] },
        ],
      },
      {
        title: 'Analysis of Financial Statements', page: 99,
        sections: [
          { no: '3.1', title: 'Comparative Statement', lessons: [
            { no: '3.1.1', title: 'Overview of Financial Statement Analysis', page: 100 },
            { no: '3.1.2', title: 'Trend Analysis', page: 101 },
            { no: '3.1.3', title: 'Comparative Financial Statement – Comparative Balance Sheet – Horizontal Analysis', page: 103 },
            { no: '3.1.4', title: 'Comparative Income Statement: Horizontal Analysis', page: 107 },
            { no: '3.1.5', title: 'Vertical Analysis – Comparative Balance Sheet – Vertical Analysis', page: 110 },
            { no: '3.1.6', title: 'Comparative Income Statement: Vertical Analysis', page: 113 },
            { no: '3.1.7', title: 'Inter Firm Comparison: Case Study/Numerical', page: 115 },
          ] },
          { no: '3.2', title: 'Ratio Analysis', lessons: [
            { no: '3.2.1', title: 'Ratio Analysis – Part 1 (Profitability Ratio)', page: 118 },
            { no: '3.2.2', title: 'Ratio Analysis- Part 2 (Liquidity Ratio)', page: 120 },
            { no: '3.2.3', title: 'Ratio Analysis: Solvency Ratio', page: 121 },
            { no: '3.2.4', title: 'Ratio Analysis: Turnover Ratios', page: 123 },
            { no: '3.2.5', title: 'Ratio Analysis – Part 5 (Earning Ratios)', page: 126 },
            { no: '3.2.6', title: 'DuPont Decomposition Analysis', page: 128 },
          ] },
          { no: '3.3', title: 'Cash Flow Statement', lessons: [
            { no: '3.3.1', title: 'Cash Flow Statement: Overview and Benefits as Per IND AS 3', page: 128 },
            { no: '3.3.2', title: 'Classification of Activities for the Preparation of Cash Flow Statement', page: 129 },
            { no: '3.3.3', title: 'Preparation of Cash Flow Statement – Numerical/Example', page: 134 },
          ] },
        ],
      },
      {
        title: 'Introduction to Cost and Management Accounting', page: 142,
        sections: [
          { no: '4.1', title: 'Cost Sheet', lessons: [
            { no: '4.1.1', title: 'Cost & Management Accounting – Introduction', page: 143 },
            { no: '4.1.2', title: 'Cost Classification', page: 144 },
            { no: '4.1.3', title: 'Cost Sheet Part 1: Explaining the Sheet', page: 148 },
            { no: '4.1.4', title: 'Cost Sheet Part II: Showing a Numerical Example', page: 149 },
          ] },
          { no: '4.2', title: 'Marginal Costing', lessons: [
            { no: '4.2.1', title: 'Marginal Costing – Meaning and Purpose', page: 152 },
            { no: '4.2.2', title: 'CVP Analysis: Contribution, P/V ratio', page: 152 },
            { no: '4.2.3', title: 'CVP Analysis – Break Even Analysis', page: 154 },
            { no: '4.2.4', title: 'CVP Analysis – Margin of Safety', page: 156 },
            { no: '4.2.5', title: 'CVP Analysis – Decision, Making, Example', page: 157 },
          ] },
          { no: '4.3', title: 'Inventory Valuation', lessons: [
            { no: '4.3.1', title: 'Inventory Valuation: Introduction, Periodic, Perpetual and FIFO', page: 160 },
            { no: '4.3.2', title: 'Inventory Valuation – LIFO & Average Method', page: 162 },
          ] },
          { no: '4.4', title: 'Standard Costing', lessons: [
            { no: '4.4.1', title: 'Standard Costing and Variance Analysis – Introduction', page: 166 },
            { no: '4.4.2', title: 'Variance Analysis – Material', page: 167 },
            { no: '4.4.3', title: 'Variance Analysis – Labour', page: 169 },
          ] },
          { no: '4.5', title: 'Budget & Budgeting', lessons: [
            { no: '4.5.1', title: 'Budget and Budgeting: Introduction and Types of Budgets', page: 171 },
            { no: '4.5.2', title: 'Types of Budgets Part 1', page: 172 },
            { no: '4.5.3', title: 'Types of Budgets Part – 2', page: 173 },
          ] },
          { no: '4.6', title: 'Numerical and Case study', lessons: [
            { no: '4.6.1', title: 'Numerical – CVP Analysis', page: 176 },
            { no: '4.6.2', title: 'Numerical – Variance Analysis', page: 176 },
            { no: '4.6.3', title: 'Numerical – Budgets (Specific Reference to Cash Budget)', page: 184 },
          ] },
        ],
      },
      {
        title: 'Latest Development Trends and Practices', page: 188,
        sections: [
          { no: '5.1', title: 'Financial Software for Analysis', lessons: [
            { no: '5.1.1', title: 'Human Resource Accounting', page: 189 },
            { no: '5.1.2', title: 'Inflation Accounting', page: 191 },
            { no: '5.1.3', title: 'IFRS: Introduction', page: 191 },
            { no: '5.1.4', title: 'IFRS Framework', page: 191 },
            { no: '5.1.5', title: 'Overview of Forensic Accounting', page: 194 },
            { no: '5.1.6', title: 'Introduction to Sustainability Accounting', page: 201 },
          ] },
        ],
      },
    ],
  },
  {
    id: 'managerial-economics', title: 'Managerial Economics', ico: '💹',
    file: 'Managerial Economics_R1 enc.pdf', pdfPages: 199,
    modules: [
      {
        title: 'Theory of Demand and Supply', page: 1,
        sections: [
          { no: '1.1', title: 'What is Demand?', lessons: [
            { no: '1.1.1', title: 'Nature of Economic Analysis', page: 2 },
            { no: '1.1.2', title: 'Scope of Economic Analysis', page: 4 },
            { no: '1.1.3', title: 'Managerial Economics in Decision Making', page: 5 },
            { no: '1.1.4', title: 'Demand Analysis', page: 6 },
            { no: '1.1.5', title: 'Individual Demand vs. Market Demand', page: 7 },
            { no: '1.1.6', title: 'Demand by Market Segmentation', page: 7 },
            { no: '1.1.7', title: 'Determinants of Demand', page: 9 },
            { no: '1.1.8', title: 'Demand Elasticities', page: 11 },
            { no: '1.1.9', title: 'Concept of Elasticity of Demand - Income, Cross, Price and Advertising Elasticity', page: 13 },
            { no: '1.1.10', title: 'Demand Elasticity Theorems', page: 15 },
            { no: '1.1.11', title: 'Elasticity in Business Decisions', page: 15 },
            { no: '1.1.12', title: 'Applications of the concept of price elasticity of demand in business decisions', page: 17 },
          ] },
          { no: '1.2', title: 'What is Supply?', lessons: [
            { no: '1.2.1', title: 'Supply vs. Quantity Supplied', page: 19 },
            { no: '1.2.2', title: 'Supply Function', page: 20 },
            { no: '1.2.3', title: 'Supply Determinants', page: 21 },
            { no: '1.2.4', title: 'Law of Supply and Supply Curve Features', page: 22 },
            { no: '1.2.5', title: 'Elasticity of Supply', page: 24 },
            { no: '1.2.6', title: 'Applying Supply Elasticities in Business Decisions', page: 24 },
            { no: '1.2.7', title: 'Market Equilibrium: Quantity and Price', page: 26 },
          ] },
          { no: '1.3', title: 'Demand Forecasting', lessons: [
            { no: '1.3.1', title: 'Needs of Demand Forecasting', page: 28 },
            { no: '1.3.2', title: 'Techniques of Demand Forecasting', page: 33 },
          ] },
          { no: '1.4', title: 'Case Study', lessons: [
            { no: '1.4.1', title: 'Case Study: Demand and Supply Analysis', page: 39 },
          ] },
        ],
      },
      {
        title: 'Theory of Production and Cost', page: 50,
        sections: [
          { no: '2.1', title: 'Production Function', lessons: [
            { no: '2.1.1', title: 'Short Run vs. Long Run', page: 51 },
            { no: '2.1.2', title: 'Factors of Production', page: 53 },
            { no: '2.1.3', title: 'Production Function and Analysis', page: 56 },
            { no: '2.1.4', title: 'Production Function: Neo-classical', page: 57 },
            { no: '2.1.5', title: 'Production Function: Cobb-Douglas', page: 57 },
            { no: '2.1.6', title: 'Production Function: Leontief', page: 58 },
            { no: '2.1.7', title: 'Isocost', page: 59 },
            { no: '2.1.8', title: 'Isocost: Feature and Example', page: 59 },
            { no: '2.1.9', title: 'Isoquant: Smooth Curvature and Right Angle', page: 60 },
            { no: '2.1.10', title: 'Isoquant: Feature and Example', page: 61 },
            { no: '2.1.11', title: 'Optimal Input Combinations: Least-Cost', page: 63 },
            { no: '2.1.12', title: 'Returns to Scale and Factor Returns', page: 65 },
            { no: '2.1.13', title: 'Expansion Path of a Firm', page: 66 },
            { no: '2.1.14', title: 'Laws of Returns to Scale Through Production Function', page: 66 },
            { no: '2.1.15', title: 'Laws of Returns to Scale Through Production Function - Example', page: 67 },
          ] },
          { no: '2.2', title: 'Cost Function', lessons: [
            { no: '2.2.1', title: 'Cost Function and Analysis', page: 69 },
            { no: '2.2.2', title: 'Relevant Costs in Decision Making', page: 70 },
            { no: '2.2.3', title: 'Theory of Cost', page: 74 },
            { no: '2.2.4', title: 'Long Run Cost and Short Run Cost', page: 75 },
            { no: '2.2.5', title: 'Types of Cost', page: 76 },
            { no: '2.2.6', title: 'Internal and External Economies and Dis-economies of Scale', page: 79 },
            { no: '2.2.7', title: 'Cost and Output Relation', page: 83 },
            { no: '2.2.8', title: 'Business Objectives Analysis: Profit Maximisation Model', page: 84 },
            { no: '2.2.9', title: 'Baumoul’s Sales Maximisation Model', page: 84 },
            { no: '2.2.10', title: 'Marris’s Model of Managerial Enterprise', page: 86 },
            { no: '2.2.11', title: 'Williamson’s Model of Managerial Discretion', page: 87 },
          ] },
          { no: '2.3', title: 'Case Study', lessons: [
            { no: '2.3.1', title: 'Case Study: Production and Cost Theory', page: 88 },
          ] },
        ],
      },
      {
        title: 'Market Structure: Price and Output Decisions', page: 97,
        sections: [
          { no: '3.1', title: 'Market Structure', lessons: [
            { no: '3.1.1', title: 'Perfect vs. Imperfect Competition', page: 99 },
            { no: '3.1.2', title: 'Perfect Competition: Price, Features, Examples', page: 99 },
            { no: '3.1.3', title: 'Monopoly: Price, Features, Examples', page: 103 },
            { no: '3.1.4', title: 'Details of 1st Degree Price Discrimination', page: 105 },
            { no: '3.1.5', title: 'Details of 2nd Degree Price Discrimination', page: 106 },
            { no: '3.1.6', title: 'Details of 3rd Degree Price Discrimination', page: 107 },
            { no: '3.1.7', title: 'Analysis of Monopolistic Competition', page: 107 },
            { no: '3.1.8', title: 'Oligopoly: Price, Features and Examples', page: 111 },
            { no: '3.1.9', title: 'Oligopoly Models: Kinky Demand and Cournot Model', page: 112 },
            { no: '3.1.10', title: 'Game Theory in Market Structure Analysis', page: 113 },
            { no: '3.1.11', title: 'Price Leadership Models', page: 114 },
            { no: '3.1.12', title: 'Cartels and Collusion', page: 115 },
          ] },
          { no: '3.2', title: 'Case study (Module Based)', lessons: [
            { no: '3.2.1', title: 'Case Study: DeBeers as Monopoly Market', page: 117 },
            { no: '3.2.2', title: 'Case Study on different types of Market', page: 119 },
          ] },
        ],
      },
      {
        title: 'Macro Economics Analysis', page: 131,
        sections: [
          { no: '4.1', title: 'National Income', lessons: [
            { no: '4.1.1', title: 'Economic Policy and Macro Variable Analysis', page: 133 },
            { no: '4.1.2', title: 'National Income Measurement Approaches', page: 133 },
            { no: '4.1.3', title: 'Circular Money Flow Models: Expanded View', page: 134 },
            { no: '4.1.4', title: 'Income Determination: Keynesian Focus', page: 136 },
            { no: '4.1.5', title: 'Investment Multiplier Concept', page: 138 },
            { no: '4.1.6', title: 'Consumption Function Influences', page: 138 },
            { no: '4.1.7', title: 'Various Motives of Money Demand and Supply', page: 140 },
            { no: '4.1.8', title: 'Liquidity Preference Function', page: 141 },
            { no: '4.1.9', title: 'Money Supply Components', page: 142 },
          ] },
          { no: '4.2', title: 'Case Study', lessons: [
            { no: '4.2.1', title: 'Case Study: GDP and Economic Crisis in Greece', page: 143 },
          ] },
        ],
      },
      {
        title: 'Business Environment', page: 154,
        sections: [
          { no: '5.1', title: 'Components of Business Environment', lessons: [
            { no: '5.1.1', title: 'Business Environment as Exogenous Variable', page: 156 },
            { no: '5.1.2', title: 'Influences on the Business Environment', page: 156 },
            { no: '5.1.3', title: 'Analysis of National Income Aggregates', page: 159 },
            { no: '5.1.4', title: 'Business Cycles and Economic Fluctuations', page: 161 },
            { no: '5.1.5', title: 'Business Cycle Phases', page: 162 },
            { no: '5.1.6', title: 'Inflation and Deflation: Causes and Types', page: 162 },
            { no: '5.1.7', title: 'Inflation\'s Impact on Macro Economic Variables', page: 167 },
            { no: '5.1.8', title: 'Controlling Inflation: Policy Analysis', page: 168 },
            { no: '5.1.9', title: 'Deflation', page: 170 },
            { no: '5.1.10', title: 'Objectives of Monetary Policy', page: 170 },
            { no: '5.1.11', title: 'Functions of Central Bank', page: 171 },
            { no: '5.1.12', title: 'Credit Policy and Corporate Sector Implications', page: 171 },
            { no: '5.1.13', title: 'Fiscal Policy: Definition, Objectives, and Economic Impact', page: 172 },
            { no: '5.1.14', title: 'Money Market', page: 173 },
            { no: '5.1.15', title: 'Capital Market and Foreign Exchange Market', page: 174 },
          ] },
          { no: '5.2', title: 'Case Study', lessons: [
            { no: '5.2.1', title: 'Case Study: Demonetisation Impact on Indian Economy', page: 175 },
          ] },
        ],
      },
    ],
  },
  {
    id: 'marketing-management', title: 'Marketing Management', ico: '📣',
    file: 'Marketing Management_ Final.pdf', pdfPages: 199,
    modules: [
      {
        title: 'Understanding Marketing in New Perspective', page: 1,
        sections: [
          { no: '1.1', title: 'Marketing Management Defined', lessons: [
            { no: '1.1.1', title: 'Marketing in the New Reality', page: 3 },
            { no: '1.1.2', title: 'Marketing Value and Scope', page: 3 },
          ] },
          { no: '1.2', title: 'Core Marketing Concepts', lessons: [
            { no: '1.2.1', title: 'Needs, Wants and Demands', page: 5 },
            { no: '1.2.2', title: 'Segmentation, Target Markets and Positioning', page: 5 },
            { no: '1.2.3', title: 'Marketing Offerings and Brands', page: 6 },
            { no: '1.2.4', title: 'Marketing Channels: Paid, Owned, Earned Media', page: 7 },
            { no: '1.2.5', title: 'Value and Satisfaction / Supply Chain', page: 7 },
            { no: '1.2.6', title: 'Competition and Marketing Environment', page: 7 },
          ] },
          { no: '1.3', title: 'Customer Value and Satisfaction', lessons: [
            { no: '1.3.1', title: 'Marketing and Customer value', page: 15 },
            { no: '1.3.2', title: 'The Value Delivery Process', page: 15 },
            { no: '1.3.3', title: 'The Value Chain', page: 16 },
            { no: '1.3.4', title: 'Core Competencies', page: 17 },
          ] },
          { no: '1.4', title: 'Philosophies of Marketing Management', lessons: [
            { no: '1.4.1', title: 'Core Marketing Concepts', page: 18 },
          ] },
          { no: '1.5', title: 'Difference between marketing and Selling', lessons: [
            { no: '1.5.2', title: 'Selling Significance', page: 22 },
          ] },
          { no: '1.6', title: 'Difference between Marketing and Relationship Marketing', lessons: [
            { no: '1.6.1', title: 'Overview of Relationship Marketing', page: 23 },
          ] },
          { no: '1.7', title: 'Difference between Marketing and Social Marketing', lessons: [
            { no: '1.7.1', title: 'Social Marketing Insights', page: 24 },
          ] },
          { no: '1.8', title: 'Strategic Planning in Marketing', lessons: [
            { no: '1.8.1', title: 'Strategy in Marketing', page: 25 },
            { no: '1.8.2', title: 'Strategic Planning Levels', page: 26 },
            { no: '1.8.3', title: 'Strategic Planning Steps', page: 28 },
            { no: '1.8.4', title: 'SWOT Analysis', page: 29 },
            { no: '1.8.5', title: 'BCG matrix', page: 30 },
            { no: '1.8.6', title: 'Marketing Strategy Factors', page: 32 },
          ] },
          { no: '1.9', title: 'Formulating the Marketing Plan', lessons: [
            { no: '1.9.1', title: 'Strategy Formulation', page: 33 },
            { no: '1.9.2', title: 'Marketing Plan Components', page: 33 },
          ] },
          { no: '1.10', title: 'Marketing for the Millennials', lessons: [
            { no: '1.10.1', title: 'The New Marketing Realities', page: 34 },
            { no: '1.10.2', title: 'The Holistic Marketing Concepts', page: 36 },
            { no: '1.10.3', title: 'Integrated Marketing', page: 36 },
            { no: '1.10.4', title: 'Ethical Marketing Delivering and Communicating Value to the Customers', page: 37 },
          ] },
          { no: '1.11', title: 'Case Study', lessons: [
            { no: '1.11.1', title: 'Case Study: Rubber Ducky Pools– Understanding Marketing from a New Perspective', page: 39 },
          ] },
        ],
      },
      {
        title: 'Analysing Consumers & Selecting Markets', page: 48,
        sections: [
          { no: '2.1', title: 'Consumer Behaviour Defined', lessons: [
            { no: '2.1.1', title: 'Insights of Consumer Behaviour', page: 50 },
            { no: '2.1.2', title: 'Significance of Consumer Behaviour', page: 51 },
            { no: '2.1.3', title: 'Consumer Behaviour Influences', page: 52 },
          ] },
          { no: '2.2', title: 'Factors Affecting Buying Decisions', lessons: [
            { no: '2.2.1', title: 'Consumer Behaviour Determinants', page: 54 },
            { no: '2.2.2', title: 'Buying Decision Types', page: 55 },
            { no: '2.2.3', title: 'Buying Decision Process', page: 56 },
            { no: '2.2.4', title: 'New Product Buying Process', page: 58 },
            { no: '2.2.5', title: 'Buying Motives Types', page: 59 },
            { no: '2.2.6', title: 'Psychological Consumer Influencers', page: 60 },
            { no: '2.2.7', title: 'Social Consumer Influencers', page: 62 },
            { no: '2.2.8', title: 'Cultural Consumer Influencers', page: 63 },
            { no: '2.2.9', title: 'Personal Consumer Influencers', page: 63 },
            { no: '2.2.10', title: 'Economic Consumer Influencers', page: 65 },
            { no: '2.2.11', title: 'Consumer Adoption Stages', page: 66 },
          ] },
          { no: '2.3', title: 'Market Segmentation Patterns and Procedures', lessons: [
            { no: '2.3.1', title: 'Concept of Market Segmentation/Definitions of Market Segmentation', page: 68 },
            { no: '2.3.2', title: 'Characteristics of Market Segmentation', page: 69 },
            { no: '2.3.3', title: 'Benefits of Market Segmentation', page: 69 },
            { no: '2.3.4', title: 'Market Segmentation Process and BASES', page: 70 },
          ] },
          { no: '2.4', title: 'Evaluating the Market Segments', lessons: [
            { no: '2.4.1', title: 'Requisites of Effective Market Segmentation', page: 75 },
          ] },
          { no: '2.5', title: 'Target the Market Segments', lessons: [
            { no: '2.5.1', title: 'Targeting in Marketing', page: 76 },
            { no: '2.5.2', title: 'Importance of Target Marketing', page: 78 },
            { no: '2.5.3', title: 'Identifying Target Market Opportunities', page: 79 },
            { no: '2.5.4', title: 'Target Marketing Strategy Improvement', page: 79 },
            { no: '2.5.5', title: 'Digital Age Customer Targeting', page: 80 },
          ] },
          { no: '2.6', title: 'Developing a Positioning Strategy', lessons: [
            { no: '2.6.1', title: 'Understanding Market Positioning', page: 82 },
            { no: '2.6.2', title: 'Positioning Elements', page: 82 },
          ] },
          { no: '2.7', title: 'Case Study', lessons: [
            { no: '2.7.1', title: 'Case Study: Rubber Ducky Pools – Analysing Consumers and Selecting Markets', page: 83 },
          ] },
        ],
      },
      {
        title: 'Managing Product Strategies', page: 94,
        sections: [
          { no: '3.1', title: 'Products and Services Defined', lessons: [
            { no: '3.1.1', title: 'Products and Services Overview', page: 96 },
          ] },
          { no: '3.2', title: 'Classification of Products', lessons: [
            { no: '3.2.1', title: 'Consumer and Industrial Products Classification', page: 97 },
            { no: '3.2.2', title: 'Consumer Products Classification in Marketing', page: 98 },
            { no: '3.2.3', title: 'Industrial Products Classification in Marketing', page: 99 },
          ] },
          { no: '3.3', title: 'New Product Development', lessons: [
            { no: '3.3.1', title: 'Definition of New Product Development', page: 101 },
            { no: '3.3.2', title: 'New Product Development: Need and Examples', page: 101 },
            { no: '3.3.3', title: 'Stages of New Product Development', page: 102 },
            { no: '3.3.4', title: 'Strategic New Product Development Approaches', page: 103 },
          ] },
          { no: '3.4', title: 'Packaging and Labeling', lessons: [
            { no: '3.4.1', title: 'Product Packaging and Functions of Package', page: 105 },
            { no: '3.4.2', title: 'Purposes of Packaging', page: 106 },
            { no: '3.4.3', title: 'Types of Packaging', page: 107 },
            { no: '3.4.4', title: 'Labeling and Package Label Purposes', page: 107 },
          ] },
          { no: '3.5', title: 'Product Mix Decisions and Line Management', lessons: [
            { no: '3.5.1', title: 'Meaning of Product Mix', page: 109 },
            { no: '3.5.2', title: 'Product Mix: Width, Length, Depth and Consistency', page: 110 },
            { no: '3.5.3', title: 'Product Line Decisions and Length', page: 113 },
            { no: '3.5.4', title: 'Line Stretching and Line Filling', page: 113 },
            { no: '3.5.5', title: 'Brand Management: Definition, Functions and Process', page: 115 },
            { no: '3.5.6', title: 'Brand Awareness, Equity and Loyalty', page: 115 },
            { no: '3.5.7', title: 'Brand Recognition and Reputation', page: 117 },
            { no: '3.5.8', title: 'Brand Asset Management', page: 117 },
          ] },
          { no: '3.6', title: 'Product Life Cycle', lessons: [
            { no: '3.6.1', title: 'Product Life Cycle and Stages', page: 119 },
            { no: '3.6.2', title: 'Factors Affecting Stage', page: 120 },
            { no: '3.6.3', title: 'Product Life Cycles', page: 121 },
          ] },
          { no: '3.7', title: 'Case Study', lessons: [
            { no: '3.7.1', title: 'Case Study: Rubber Ducky Pools – Managing Product Strategies', page: 124 },
          ] },
        ],
      },
      {
        title: 'Environmental Law, Legislations and Treaties', page: 133,
        sections: [
          { no: '4.1', title: 'Price Defining', lessons: [
            { no: '4.1.1', title: 'Price vs. Value in Marketing', page: 135 },
            { no: '4.1.2', title: 'Factors Influencing Pricing', page: 135 },
            { no: '4.1.3', title: 'Importance of Pricing', page: 136 },
          ] },
          { no: '4.2', title: 'Setting the Price, Adapting the Price, Identifying Pricing Strategies', lessons: [
            { no: '4.2.1', title: 'Pricing Policy and Policy Setting Steps', page: 137 },
            { no: '4.2.2', title: 'Cost Plus Pricing: Types, Pros and Cons', page: 138 },
            { no: '4.2.3', title: 'Skimming Pricing: Pros and Cons', page: 139 },
            { no: '4.2.4', title: 'Penetration Pricing: Pros and Cons', page: 139 },
            { no: '4.2.5', title: 'Price Discrimination: Pros and Cons', page: 140 },
            { no: '4.2.6', title: 'Premium Pricing: Pros and Cons', page: 140 },
            { no: '4.2.7', title: 'Psychological Pricing: Pros and Cons', page: 140 },
            { no: '4.2.8', title: 'Dynamic Pricing: Pros and Cons', page: 141 },
            { no: '4.2.9', title: 'Target Pricing: Pros and Cons', page: 142 },
            { no: '4.2.10', title: 'Absorption Marginal-Cost Pricing: Pros and Cons', page: 142 },
            { no: '4.2.11', title: 'Absorption Pricing: Pros and Cons', page: 142 },
            { no: '4.2.12', title: 'Value-Based Pricing: Pros and Cons', page: 143 },
            { no: '4.2.13', title: 'Odd Pricing: Pros and Cons', page: 143 },
            { no: '4.2.14', title: 'Mark-Up Pricing: Pros and Cons', page: 144 },
            { no: '4.2.15', title: 'Target Return Pricing: Pros and Cons', page: 144 },
            { no: '4.2.16', title: 'Going-Rate Pricing: Pros and Cons', page: 144 },
          ] },
          { no: '4.3', title: 'Initiating and Responding the Price Changes', lessons: [
            { no: '4.3.1', title: 'Adapting to Organisational Price Forces', page: 145 },
            { no: '4.3.2', title: 'Adapting to Market Price Forces', page: 146 },
          ] },
          { no: '4.4', title: 'Managing Channel Dynamics', lessons: [
            { no: '4.4.1', title: 'Marketing Channels: Definition and Significance', page: 147 },
            { no: '4.4.2', title: 'Marketing Channel Functions and Flows', page: 148 },
            { no: '4.4.3', title: 'Channel Design and Management Decisions', page: 149 },
          ] },
          { no: '4.5', title: 'Channel Dynamics', lessons: [
            { no: '4.5.1', title: 'Features of Vertical Marketing System', page: 152 },
            { no: '4.5.2', title: 'Vertical Marketing System Types and Benefits', page: 152 },
            { no: '4.5.3', title: 'Features of Horizontal Marketing System', page: 153 },
            { no: '4.5.4', title: 'Horizontal Marketing System: Types and Benefits', page: 153 },
            { no: '4.5.5', title: 'Multi-Channel Marketing Features', page: 154 },
            { no: '4.5.6', title: 'Types and Benefits of Multi-Channel', page: 154 },
          ] },
          { no: '4.6', title: 'Market Logistics Decisions', lessons: [
            { no: '4.6.1', title: 'Wholesaling, Retailing and Logistics', page: 155 },
            { no: '4.6.2', title: 'Retailing and Types of Retailers', page: 156 },
            { no: '4.6.3', title: 'Wholesaler vs. Retailer', page: 159 },
            { no: '4.6.4', title: 'Integrated Market Logistics', page: 160 },
            { no: '4.6.5', title: 'Supply Chain Competitiveness', page: 160 },
            { no: '4.6.6', title: 'International Supply Chain Management', page: 161 },
            { no: '4.6.7', title: 'Future Logistics and SCM', page: 161 },
          ] },
          { no: '4.7', title: 'Case Study', lessons: [
            { no: '4.7.1', title: 'Case Study – Rubber Ducky Pools: Pricing', page: 162 },
          ] },
        ],
      },
      {
        title: 'Managing Channel Dynamics & Integrated Marketing Communication', page: 171,
        sections: [
          { no: '5.1', title: 'Introduction to Integrated Marketing', lessons: [
            { no: '5.1.1', title: 'Integrated Marketing Communication', page: 173 },
            { no: '5.1.2', title: 'IMC Tools Overview', page: 174 },
            { no: '5.1.3', title: 'Marketing Communication Process', page: 175 },
          ] },
          { no: '5.2', title: 'Emerging Trends, Development and Practices', lessons: [
            { no: '5.2.1', title: 'Emerging Trends in the Market', page: 178 },
            { no: '5.2.2', title: 'Sustainable and Ethical Marketing Practices', page: 179 },
            { no: '5.2.3', title: 'AI in Customer Segmentation', page: 179 },
            { no: '5.2.4', title: 'AI in Personalized Marketing', page: 180 },
            { no: '5.2.5', title: 'AI in Predictive Analytics', page: 180 },
            { no: '5.2.6', title: 'AI in Customer Service', page: 180 },
          ] },
          { no: '5.3', title: 'Case Study', lessons: [
            { no: '5.3.1', title: 'Case Study: Rubber Ducky Pools', page: 181 },
          ] },
        ],
      },
    ],
  },
  {
    id: 'professional-communication', title: 'Professional Communication', ico: '🗣️',
    file: 'Professional Communication F.pdf', pdfPages: 197,
    modules: [
      {
        title: 'Effective Communication: Foundations and Techniques', page: 1,
        sections: [
          { no: '1.1', title: 'Verbal and Non-verbal Communication', lessons: [
            { no: '1.1.1', title: 'Professional Communication: Introduction and Types of Communication', page: 2 },
            { no: '1.1.2', title: 'Oral Communication: Forms, Advantages and Limitations', page: 6 },
            { no: '1.1.3', title: 'Written Communication: Forms, Advantages and Limitations', page: 7 },
            { no: '1.1.4', title: 'Non-verbal Communication: Principle and Significance', page: 8 },
            { no: '1.1.5', title: 'KOPPACT: Kinesis, Oculesics, and Paralanguage KOPPACT', page: 14 },
            { no: '1.1.6', title: 'KOPPACT: Proxemics, Artifacts, Chronemics, and Tactilics', page: 17 },
            { no: '1.1.7', title: 'Barriers to Effective Communication', page: 18 },
            { no: '1.1.8', title: 'Guidelines to Overcome Communication Barriers', page: 22 },
            { no: '1.1.9', title: 'Goals of Organisational Communication', page: 25 },
            { no: '1.1.10', title: 'Organisational Goodwill', page: 29 },
            { no: '1.1.11', title: 'Receiver Understanding, Receiver Response', page: 32 },
            { no: '1.1.12', title: 'Favourable Relationship', page: 36 },
          ] },
        ],
      },
      {
        title: 'Social and Cultural Communication', page: 46,
        sections: [
          { no: '2.1', title: 'Social Communication Essentials', lessons: [
            { no: '2.1.1', title: 'Small Talk: Purpose, Topics, and Conversation Starters', page: 46 },
            { no: '2.1.2', title: 'Small Talk: Conversational Patterns: Gender, Cultural, and Social Differences', page: 47 },
            { no: '2.1.3', title: 'Building Rapport', page: 49 },
            { no: '2.1.4', title: 'Methods to Build Rapport', page: 50 },
            { no: '2.1.5', title: 'Informal Communication: Meaning and Characteristics', page: 51 },
            { no: '2.1.6', title: 'Advantages and Limitations of Informal Communication', page: 54 },
          ] },
          { no: '2.2', title: 'Cross-Cultural Communication', lessons: [
            { no: '2.2.1', title: 'Introduction to Cross Cultural Communication', page: 57 },
            { no: '2.2.2', title: 'Culture and Context', page: 58 },
            { no: '2.2.3', title: 'Ethnocentrism', page: 63 },
            { no: '2.2.4', title: 'Stereotyping', page: 64 },
            { no: '2.2.5', title: 'Cultural Relativism', page: 65 },
            { no: '2.2.6', title: 'Cultural Shock and Social Change', page: 66 },
          ] },
          { no: '2.3', title: 'Communication Today', lessons: [
            { no: '2.3.1', title: 'Intercultural Communication in a Globalized World', page: 67 },
            { no: '2.3.2', title: 'Gender and Communication', page: 71 },
            { no: '2.3.3', title: 'Language, Communication and Culture', page: 74 },
            { no: '2.3.4', title: 'Nonverbal Communication and Culture', page: 78 },
            { no: '2.3.5', title: 'Intercultural Communication Competence', page: 82 },
          ] },
        ],
      },
      {
        title: 'Effective Meetings: Meaning, Purposes and Techniques', page: 93,
        sections: [
          { no: '3.1', title: 'Meetings', lessons: [
            { no: '3.1.1', title: 'Meetings: Meaning and Purpose', page: 93 },
            { no: '3.1.2', title: 'Steps in Conducting a Meeting', page: 96 },
            { no: '3.1.3', title: 'Written Documents Related to Meetings: Notice, Agenda, and Minutes', page: 97 },
            { no: '3.1.4', title: 'Online Meetings', page: 101 },
            { no: '3.1.5', title: 'Preparation and Practice', page: 103 },
            { no: '3.1.6', title: 'Delivering the Presentation', page: 106 },
            { no: '3.1.7', title: 'Qualities of a Skilful Presenter', page: 110 },
            { no: '3.1.8', title: 'Capturing and Maintaining Attention', page: 114 },
            { no: '3.1.9', title: 'Handling Questions', page: 118 },
            { no: '3.1.10', title: 'Power Point Presentations', page: 121 },
          ] },
        ],
      },
      {
        title: 'Business Reports', page: 130,
        sections: [
          { no: '4.1', title: 'Report Writing', lessons: [
            { no: '4.1.1', title: 'Significance of Reports', page: 130 },
            { no: '4.1.2', title: 'Types of Reports', page: 132 },
            { no: '4.1.3', title: 'Report Planning', page: 135 },
            { no: '4.1.4', title: 'Process of Report Writing', page: 135 },
            { no: '4.1.5', title: 'Visual Aids in Reports', page: 137 },
          ] },
          { no: '4.2', title: 'Leadership', lessons: [
            { no: '4.2.1', title: 'Types of Leadership', page: 139 },
            { no: '4.2.2', title: 'Leadership that Supports Diversity and Inclusion', page: 143 },
            { no: '4.2.3', title: 'Strategies for Effective Leadership Communication', page: 147 },
          ] },
        ],
      },
      {
        title: 'Job Readiness Skill', page: 157,
        sections: [
          { no: '5.1', title: 'Employment Communication', lessons: [
            { no: '5.1.1', title: 'Cover Letter', page: 157 },
            { no: '5.1.2', title: 'Resume', page: 161 },
            { no: '5.1.3', title: 'Participating in Group Discussion', page: 163 },
            { no: '5.1.4', title: 'Preparation for Interview', page: 165 },
            { no: '5.1.5', title: 'Appearing in an Interview', page: 166 },
            { no: '5.1.6', title: 'Defining Interpersonal Communication', page: 167 },
            { no: '5.1.7', title: 'Motives for Interpersonal Communication in Work Groups and Teams', page: 171 },
            { no: '5.1.8', title: 'Emotional Intelligence', page: 174 },
            { no: '5.1.9', title: 'Managing Conflict', page: 178 },
            { no: '5.1.10', title: 'Challenges to Handling Conflict', page: 181 },
          ] },
        ],
      },
    ],
  },
  {
    id: 'statistics-for-management', title: 'Statistics for Management', ico: '📊',
    file: 'Statistics For Management_Final.pdf', pdfPages: 182,
    modules: [
      {
        title: 'Introduction', page: 1,
        sections: [
          { no: '1.1', title: 'Introduction', lessons: [
            { no: '1.1.1', title: 'Statistical Analysis', page: 1 },
            { no: '1.1.2', title: 'Statistics: Limitations and Uses', page: 2 },
            { no: '1.1.3', title: 'Descriptive vs. Inferential Statistics', page: 3 },
            { no: '1.1.4', title: 'Statistics: Importance and Scope', page: 4 },
            { no: '1.1.5', title: 'Population and Sample', page: 5 },
          ] },
          { no: '1.2', title: 'Tabular and Graphical Descriptive Techniques Using MS Excel', lessons: [
            { no: '1.2.1', title: 'Importance of Graphical Representation of Data', page: 6 },
            { no: '1.2.2', title: 'Bar Chart', page: 6 },
            { no: '1.2.3', title: 'Pie Chart', page: 10 },
            { no: '1.2.4', title: 'Histogram', page: 10 },
            { no: '1.2.5', title: 'Frequency Polygon', page: 11 },
            { no: '1.2.6', title: 'Ogives', page: 12 },
            { no: '1.2.7', title: 'Pareto Chart', page: 14 },
            { no: '1.2.8', title: 'Stem-and-Leaf Display', page: 14 },
            { no: '1.2.9', title: 'Cross-Tabulations', page: 15 },
            { no: '1.2.10', title: 'Scatter Plot and Trend Line', page: 16 },
          ] },
          { no: '1.3', title: 'Numerical Measures Using MS Excel', lessons: [
            { no: '1.3.1', title: 'Arithmetic Mean: Overview and Use', page: 18 },
            { no: '1.3.2', title: 'Median: Basics and Application', page: 22 },
            { no: '1.3.3', title: 'Mode: Fundamentals and Usage', page: 24 },
            { no: '1.3.4', title: 'Partition Values: Quartiles and Percentiles', page: 26 },
            { no: '1.3.5', title: 'Measures of Dispersion: Range and Application', page: 27 },
            { no: '1.3.6', title: 'InterQuartile Range: Concept and Use', page: 29 },
            { no: '1.3.7', title: 'Standard Deviation and Variance', page: 30 },
            { no: '1.3.8', title: 'Relative Dispersion: Coefficient of Variation', page: 34 },
            { no: '1.3.9', title: 'Relevant Industry Example', page: 35 },
            { no: '1.3.10', title: 'Case Study', page: 36 },
          ] },
        ],
      },
      {
        title: 'Probability and Probability Distributions', page: 44,
        sections: [
          { no: '2.1', title: 'Probability Theory', lessons: [
            { no: '2.1.1', title: 'Introduction of Probability', page: 44 },
            { no: '2.1.2', title: 'Types of Events', page: 45 },
            { no: '2.1.3', title: 'Algebra of Events', page: 46 },
            { no: '2.1.4', title: 'Addition Rule of Probability', page: 47 },
            { no: '2.1.5', title: 'Multiplication Rule of Probability', page: 48 },
            { no: '2.1.6', title: 'Conditional, Joint and Marginal Probability', page: 49 },
            { no: '2.1.7', title: 'Bayes’ Theorem', page: 50 },
          ] },
          { no: '2.2', title: 'Probability Distribution', lessons: [
            { no: '2.2.1', title: 'Introduction of Random Variables', page: 52 },
            { no: '2.2.2', title: 'Mean and Expected Value of Random Variable', page: 52 },
            { no: '2.2.3', title: 'Variance and Standard Deviation of Random Variable', page: 53 },
            { no: '2.2.4', title: 'Binomial Distribution Basics', page: 53 },
            { no: '2.2.5', title: 'Binomial Distribution Uses', page: 54 },
            { no: '2.2.6', title: 'Poisson Distribution Overview', page: 55 },
            { no: '2.2.7', title: 'Poisson Distribution Applications', page: 56 },
            { no: '2.2.8', title: 'Normal Distribution and Empirical Rule', page: 57 },
            { no: '2.2.9', title: 'Standard Normal Distribution Intro', page: 59 },
            { no: '2.2.10', title: 'Applications of Standard Normal Distribution', page: 60 },
            { no: '2.2.11', title: 'Relevant Industry Example', page: 61 },
            { no: '2.2.12', title: 'Case Study', page: 65 },
          ] },
        ],
      },
      {
        title: 'Sampling', page: 74,
        sections: [
          { no: '3.1', title: 'Sampling, Sampling Distribution and Estimation', lessons: [
            { no: '3.1.1', title: 'Introduction of Sampling', page: 75 },
            { no: '3.1.2', title: 'Types of Sampling', page: 77 },
            { no: '3.1.3', title: 'Types of Sampling, Non-Sampling Errors and Precautions', page: 85 },
            { no: '3.1.4', title: 'Central Limit Theorem', page: 86 },
            { no: '3.1.5', title: 'Sampling Distribution of the Mean', page: 86 },
            { no: '3.1.6', title: 'Sampling Distribution of Proportion', page: 87 },
            { no: '3.1.7', title: 'Estimation: Introduction', page: 87 },
            { no: '3.1.8', title: 'Types of Estimation', page: 88 },
            { no: '3.1.9', title: 'Statistic for Estimating Population Mean', page: 89 },
            { no: '3.1.10', title: 'Confidence Interval', page: 90 },
            { no: '3.1.11', title: 'Estimating Population Mean Using t Statistic', page: 90 },
            { no: '3.1.12', title: 'Confidence Interval Estimation for Population Proportion', page: 92 },
            { no: '3.1.13', title: 'Relevant Industry Example', page: 93 },
            { no: '3.1.14', title: 'Case Study', page: 94 },
          ] },
        ],
      },
      {
        title: 'Hypothesis Testing', page: 102,
        sections: [
          { no: '4.1', title: 'Fundamental Concepts of Hypothesis Testing', lessons: [
            { no: '4.1.1', title: 'Introduction to Hypothesis Testing', page: 103 },
            { no: '4.1.2', title: 'Null and Alternate Hypothesis Creation', page: 105 },
            { no: '4.1.3', title: 'Type-I and Type-II Errors', page: 106 },
            { no: '4.1.4', title: 'Significance Level and Critical Region', page: 106 },
            { no: '4.1.5', title: 'Standard Error', page: 107 },
            { no: '4.1.6', title: 'Confidence Interval', page: 108 },
          ] },
          { no: '4.2', title: 'Inference: Population', lessons: [
            { no: '4.2.1', title: 't-Statistic for Single Population Mean', page: 109 },
            { no: '4.2.2', title: 'z-Statistic for Single Population Mean', page: 110 },
            { no: '4.2.3', title: 'Population Proportion Hypothesis Testing', page: 112 },
          ] },
          { no: '4.3', title: 'Inference: Comparing Two Populations', lessons: [
            { no: '4.3.1', title: 'Inference on Two Mean Differences', page: 115 },
            { no: '4.3.2', title: 'Inference on Two Proportion Differences', page: 116 },
            { no: '4.3.3', title: 'Independent and Matched Samples', page: 118 },
            { no: '4.3.4', title: 'Two Population Variances Ratio Inference', page: 119 },
          ] },
          { no: '4.4', title: 'ANOVA', lessons: [
            { no: '4.4.1', title: 'Analysis of Variance (ANOVA)', page: 121 },
            { no: '4.4.2', title: 'Hypothesis Testing in Industry (MS Excel)', page: 122 },
          ] },
          { no: '4.5', title: 'Chi-Squared Tests', lessons: [
            { no: '4.5.1', title: 'Chi-squared Tests for Goodness of Fit and Independence', page: 124 },
            { no: '4.5.2', title: 'Case Study: Using MS Excel', page: 127 },
          ] },
        ],
      },
      {
        title: 'Forecasting Techniques', page: 140,
        sections: [
          { no: '5.1', title: 'Correlation and Regression Analysis', lessons: [
            { no: '5.1.1', title: 'Covariance and Correlation Overview', page: 140 },
            { no: '5.1.2', title: 'Measuring Relationships with Covariance', page: 141 },
            { no: '5.1.3', title: 'Pearson R: Relationship Analysis', page: 142 },
            { no: '5.1.4', title: 'Practical Uses of Covariance and Correlation', page: 142 },
            { no: '5.1.5', title: 'Correlation Varieties', page: 143 },
            { no: '5.1.6', title: 'Karl Pearson’s Coefficient Introduction', page: 145 },
            { no: '5.1.7', title: 'Spearman Rank Correlation Primer', page: 148 },
            { no: '5.1.8', title: 'Pearson and Spearman Correlation Uses', page: 151 },
            { no: '5.1.9', title: 'Regression modelling Essentials', page: 153 },
            { no: '5.1.10', title: 'Least Square Method Overview', page: 154 },
            { no: '5.1.11', title: 'Curve Fitting Basics', page: 156 },
            { no: '5.1.12', title: 'Model Evaluation Techniques', page: 157 },
            { no: '5.1.13', title: 'Standard Error of Estimate', page: 157 },
            { no: '5.1.14', title: 'Coefficient of Determination', page: 159 },
          ] },
          { no: '5.2', title: 'Time Series Analysis', lessons: [
            { no: '5.2.1', title: 'Time Series Analysis Introduction', page: 160 },
            { no: '5.2.2', title: 'Secular Trends Examination', page: 161 },
            { no: '5.2.3', title: 'Seasonal Variation Analysis', page: 162 },
            { no: '5.2.4', title: 'Cyclical and Irregular Variations', page: 162 },
            { no: '5.2.5', title: 'Numerical Trend Analysis', page: 163 },
            { no: '5.2.6', title: 'Measuring Cyclical and Irregular Variations', page: 165 },
            { no: '5.2.7', title: 'Numerical Trend Analysis Application', page: 166 },
            { no: '5.2.8', title: 'Case Study', page: 168 },
          ] },
        ],
      },
    ],
  },
];

export const lessonsOfModule = (m) => m.sections.flatMap((s) => s.lessons);
export const lessonsOfSubject = (s) => s.modules.flatMap(lessonsOfModule);

export const lessonPath = (subjectId, no) => `/mba-acca/subjects/${subjectId}/lessons/${no}`;

// Where each lesson sits (module, section, neighbours), so a lesson page can find its place from the URL.
// Lesson numbers are unique inside a subject but repeat across subjects, so the subject id is always part of the lookup.
const REFS = Object.fromEntries(SUBJECTS.map((s) => {
  const list = [];
  s.modules.forEach((m, moduleIndex) => m.sections.forEach((section) => section.lessons.forEach((lesson) => list.push({ subject: s, module: m, moduleIndex, section, lesson }))));
  return [s.id, { list, at: Object.fromEntries(list.map((r, i) => [r.lesson.no, i])) }];
}));
export const lessonRef = (subjectId, no) => {
  const r = REFS[subjectId];
  const i = r?.at[no];
  if (i === undefined) return null;
  return { ...r.list[i], index: i, total: r.list.length, prev: r.list[i - 1] || null, next: r.list[i + 1] || null };
};

export const subjectById = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
export const eventById = Object.fromEntries(CALENDAR.map((e) => [e.id, e]));
