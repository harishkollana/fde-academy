// Corporate Mitra notes: one lesson per file in a folder per week. Drop a new file in and it appears in the sidebar.
// A lesson file default-exports { title, goal, covers, terms, blocks }; see README.md in this folder.

export const WEEKS = [
  { id: 'intro', short: 'intro', label: 'Start here', title: 'Introduction', emoji: '🎓', color: '#e8590c', tint: '#ffe0c2',
    blurb: 'What the Corporate Mitra course is, who it is for, and what you will be able to do at the end.' },
  { id: 'week1', short: 'w1', label: 'Week 1', title: 'MSMEs and how a business is set up', emoji: '🏭', color: '#1971c2', tint: '#d0e4ff',
    blurb: 'The small-business sector of India, every legal form a business can take, and the licences it needs.' },
  { id: 'week2', short: 'w2', label: 'Week 2', title: 'MSME classification, Udyam registration and choosing a project', emoji: '📋', color: '#2f9e44', tint: '#d3f9d8',
    blurb: 'Micro, small or medium? The 2025 limits, how to register on Udyam (and Udyam Assist, NIC code, NSIC), and how an entrepreneur picks and tests a business idea with payback, NPV and IRR.' },
  { id: 'week3', short: 'w3', label: 'Week 3', title: 'Money, schemes and clearances', emoji: '💰', color: '#7048e8', tint: '#e5dbff',
    blurb: 'Government schemes and how to arrange finance: Mudra, PMEGP, the second loan, Lean, the credit guarantee (CGTMSE) and export credit, plus the registrations, clearances and machinery a unit needs.' },
  { id: 'week4', short: 'w4', label: 'Week 4', title: 'Funding the business: credit, bill discounting, TReDS and equity', emoji: '🏦', color: '#c2255c', tint: '#ffdeeb',
    blurb: 'How a small business gets money from banks and financiers, and from investors.' },
  { id: 'week5', short: 'w5', label: 'Week 5', title: 'Accounting from zero: transactions, bookkeeping and financial statements', emoji: '📒', color: '#0c8599', tint: '#c5f6fa',
    blurb: 'What a business transaction is, the basic accounting terms, double-entry bookkeeping and the parts of the financial statements.' },
  { id: 'week6', short: 'w6', label: 'Week 6', title: 'Preparing financial statements and using Excel', emoji: '📊', color: '#e67700', tint: '#ffec99',
    blurb: 'Building the financial statements step by step, and using Excel for accounting work.' },
];

const files = import.meta.glob('./*/*.js', { eager: true });

const weekIndex = (id) => WEEKS.findIndex((w) => w.id === id);

export const LESSONS = Object.entries(files)
  .map(([path, mod]) => {
    const [, weekId, file] = path.split('/');
    const week = WEEKS[weekIndex(weekId)];
    const name = file.replace(/\.js$/, '');
    return { ...mod.default, id: `${week.short}-${name}`, file: name, week, weekId, num: parseInt(name, 10) };
  })
  .filter((l) => l.week && l.title)
  .sort((a, b) => weekIndex(a.weekId) - weekIndex(b.weekId) || a.file.localeCompare(b.file))
  .map((l, i) => ({ ...l, index: i }));

export const lessonById = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const lessonsOfWeek = (weekId) => LESSONS.filter((l) => l.weekId === weekId);
