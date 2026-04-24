// Central re-export — all data modules accessible via '../data'

export { DECISIONS } from './decisions';
export { ROLES } from './roles';
export { DOMAINS, getDomain } from './domains';
export { FACILITIES } from './facilities';
export { HANDLED } from './handled';
export { ASSIST_ITEMS, ASSIST_SUMMARY, ASSIST_PRESETS } from './assist';
export { PAGE_DATA, getPageData } from './pages';

// Legacy data kept for backward compat
export const WHAT_CHANGED = [
  { a: 'Heritage Oaks health score',   b: '72 \u2192 68',           dir: 'down', d: '3 new incidents, 4 overdue wound assessments.' },
  { a: 'Pacific Gardens health score', b: '88 \u2192 91',           dir: 'up',   d: 'Quarter-high. 86% occupancy, zero critical incidents.' },
  { a: 'Agency labor spend',           b: '+67% vs budget',     dir: 'down', d: 'Three facilities driving the variance.' },
  { a: 'Bank recs + AP subledger',     b: 'closed',             dir: 'up',   d: 'Month-end close 68% complete.' },
  { a: 'Night CNA overtime',           b: '+340% Meadowbrook',  dir: 'down', d: '3 call-offs on Mar 10 triggered premium fills.' },
  { a: 'Survey corrections filed',     b: '2 of 2',             dir: 'up',   d: 'Bayview POC accepted.' },
];
