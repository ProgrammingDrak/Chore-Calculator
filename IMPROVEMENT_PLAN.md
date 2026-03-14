# Bounty Tracker (Chore Calculator) -- Improvement Plan

## Context

### Quick Refresher
Bounty Tracker is a vanilla JS single-page app (index.html + script.js at 2023 lines + style.css). Three tabs: **Kanban board** (with calendar views), **Pomodoro timer**, and **Reward wheel**. Points are auto-calculated from `time x priority x difficulty` multipliers. All data lives in browser localStorage. No backend, no frameworks, no dependencies.

**What's been built:** Full task CRUD with 5 status lanes, drag-drop kanban grouped by status/priority/assignee, month/week/3-day/day calendar views with planning vs actual modes, Pomodoro timer with partial completion + continuation tasks, reward wheel with weighted slices + free spin earning, import/export, settings management.

**What's on the readme TODO:** Custom modifiers, bounty board notifications, form resets, custom person names, times-per-week, monthly archival, GitHub remote sync, editable person pages.

---

## Issues Ranked by Criticality

### TIER 1: DATA LOSS / CRASH RISKS (~6 hrs)

| # | Issue | Time | What & Why |
|---|-------|------|------------|
| 1 | **Unvalidated JSON.parse calls** | 1.5 hrs | 11 `JSON.parse(localStorage.getItem(...))` calls with zero try-catch. Corrupted localStorage (browser crash during write, quota issues) = app crashes on load with no recovery. Most likely cause of total data loss. |
| 2 | **No error handling anywhere** | 3 hrs | Only 1 try-catch in 2023 lines (in importData). localStorage quota exceeded, DOM not found, malformed data -- all crash silently. |
| 3 | **No import validation** | 1.5 hrs | `importData()` (line 1973) accepts any JSON and directly overwrites all localStorage. Wrong file = all data gone. |

### TIER 2: SECURITY VULNERABILITIES (~5 hrs)

| # | Issue | Time | What & Why |
|---|-------|------|------------|
| 4 | **XSS via inline onclick in dynamic HTML** | 4 hrs | ~9 instances where card IDs/user data are interpolated into onclick strings (lines 718, 791, 994, 1763-1765). The fix pattern already exists at line 348 (addEventListener). Need to convert all dynamic onclicks. |
| 5 | **Drag-drop accepts unvalidated IDs** | 0.5 hrs | Line 313: `dataTransfer.getData()` passed directly to `updateCard()`. Trivial guard. |
| 6 | **No Content Security Policy** | 0.5 hrs | Add CSP meta tag to index.html. Quick defense-in-depth. |

### TIER 3: STABILITY & PERFORMANCE (~6 hrs)

| # | Issue | Time | What & Why |
|---|-------|------|------------|
| 7 | **N+1 query in calendar rendering** | 2 hrs | `focusLog.filter()` called multiple times per day cell (lines 703, 725, 980). 30 days x multiple calls = 60-120 full array scans per render. Pre-index into a Map. |
| 8 | **Calendar rendering duplication** | 2 hrs | `renderMonthCalendar()` (line 671) and `renderMonthGridHTML()` (line 951) are ~150 lines of near-identical logic. Bugs fixed in one get missed in the other. |
| 9 | **Event listener re-attachment** | 2 hrs | Not a leak (innerHTML replacement GCs old nodes), but switching to event delegation on the container during refactor is cleaner. |

### TIER 4: CODE QUALITY (~13.5 hrs)

| # | Issue | Time | What & Why |
|---|-------|------|------------|
| 10 | **Monolithic 2023-line file** | 8 hrs | 110 functions in global scope. Already has section comments mapping to natural modules: `data.js`, `kanban.js`, `calendar.js`, `pomodoro.js`, `wheel.js`, `settings.js`, `utils.js`, `app.js`. Prerequisite for testability. |
| 11 | **String concat for HTML building** | 3 hrs | 30+ instances of `'<div class="' + foo + '">'`. Convert to template literals during module split. |
| 12 | **Deprecated APIs + magic numbers** | 1 hr | `.substr()` on line 8 (use `.slice()`). Magic numbers 1800, 4000, 628.32 need named constants. |
| 13 | **No linting/formatting** | 1.5 hrs | Add ESLint + Prettier. Run auto-fix after module split. |

### TIER 5: ACCESSIBILITY (~9.5 hrs)

| # | Issue | Time | What & Why |
|---|-------|------|------------|
| 14 | **Zero ARIA attributes** | 3 hrs | No `aria-` anything in the entire codebase. Tabs, modals, timer, kanban -- none announced to screen readers. |
| 15 | **No keyboard navigation** | 4 hrs | Drag-drop is mouse-only. No focus trap in modals. No Escape to close. Kanban cards/calendar cells are unfocusable divs. |
| 16 | **Missing form labels** | 1.5 hrs | Modal inputs lack `<label>` elements. Quick wins. |
| 17 | **Color-only priority indicators** | 1 hr | Priority badges use color alone (though text labels exist). Verify contrast, add `aria-label` for color borders. |

### TIER 6: TESTING & DOCS (~11 hrs)

| # | Issue | Time | What & Why |
|---|-------|------|------------|
| 18 | **Zero tests** | 8 hrs | No test files at all. After module split, unit test: `calculatePoints()`, CRUD operations, `escapeHtml()`, import validation, calendar date math. Use Vitest. |
| 19 | **No documentation** | 3 hrs | Readme is just a TODO list. Need setup guide, data schema docs, architecture overview. |

### TIER 7: NEW FEATURES (~31.5 hrs)

| # | Feature | Time | Source |
|---|---------|------|--------|
| 20 | Form reset after task submission | 0.5 hrs | readme TODO |
| 21 | Custom person names | 1 hr | readme TODO |
| 22 | Custom task modifiers for points | 2 hrs | readme TODO |
| 23 | Times per week field | 2 hrs | readme TODO |
| 24 | Editable task list on person pages | 3 hrs | readme TODO |
| 25 | Recurring task support | 4 hrs | obvious gap |
| 26 | Bounty board notifications + claims | 4 hrs | readme TODO |
| 27 | Bulk operations (multi-select) | 4 hrs | obvious gap |
| 28 | Monthly data export/archival | 3 hrs | readme TODO |
| 29 | GitHub-synced remote storage | 8 hrs | readme TODO |

---

## Execution Timeline

### Phase 1: Critical Stability + Security (Days 1-2, ~11 hrs)
**Goal: Stop the app from crashing and losing data.**

1. Wrap all 11 `JSON.parse` calls in try-catch with fallback defaults
2. Add error boundaries around localStorage ops, DOM queries, render functions; add `window.onerror`
3. Add schema validation to `importData()` -- verify cards array, required fields, settings shape
4. Convert ~9 dynamic onclick interpolations to addEventListener (follow existing pattern at line 348)
5. Add CSP meta tag + drag-drop ID validation guard

**Files:** `script.js` (data layer lines 69-168, import lines 1973-1993, all render functions), `index.html` (CSP)

### Phase 2: Architecture Refactor (Days 3-5, ~14.5 hrs)
**Goal: Make the codebase maintainable and testable.**

1. Split script.js into ES modules along existing section boundaries
2. Merge duplicate calendar render functions into single parameterized function
3. Pre-index focusLog by date into Map before render loops
4. Convert string concatenation to template literals during split
5. Replace `.substr()`, extract magic numbers to constants
6. Add ESLint + Prettier, run auto-fix

**Files:** `script.js` splits into `utils.js`, `data.js`, `kanban.js`, `calendar.js`, `pomodoro.js`, `wheel.js`, `settings.js`, `app.js`; update `index.html` script tag to `type="module"`

### Phase 3: Accessibility (Days 6-7, ~9.5 hrs)
**Goal: Make the app usable by everyone.**

1. Add `<label>` elements to all form inputs
2. Add ARIA roles/labels: `role="tablist"`, `role="tabpanel"`, `aria-live="polite"` on timer, `aria-modal="true"`
3. Add text/icon indicators alongside priority colors
4. Keyboard drag-drop alternative, focus traps in modals, Escape to close, `tabindex="0"` on cards

**Files:** `index.html`, all module files, `style.css` (focus indicators)

### Phase 4: Testing + Documentation (Days 8-9, ~11 hrs)
**Goal: Establish safety net for future changes.**

1. Set up Vitest, write tests for utils, data CRUD, import validation, calendar date math, points edge cases
2. Write proper README: overview, setup, data schema, architecture, localStorage keys

**Files:** New test files, `readme` -> proper `README.md`

### Phase 5: Quick Feature Wins (Day 10, ~5.5 hrs)
1. Form reset after submission (0.5 hrs)
2. Custom person names (1 hr)
3. Custom task modifiers for points (2 hrs)
4. Times per week field (2 hrs)

### Phase 6: Major Features (Days 11-15, ~18 hrs)
1. Recurring tasks (4 hrs)
2. Bounty board notifications + claims (4 hrs)
3. Editable task list on person pages (3 hrs)
4. Bulk operations (4 hrs)
5. Monthly data export/archival (3 hrs)

### Phase 7: Advanced Feature (Day 16+, ~8 hrs)
1. GitHub-synced remote storage -- requires auth, conflict resolution, network handling

---

## Summary

| Phase | Focus | Hours | Cumulative |
|-------|-------|-------|------------|
| 1 | Critical Stability + Security | 11 | 11 |
| 2 | Architecture Refactor | 14.5 | 25.5 |
| 3 | Accessibility | 9.5 | 35 |
| 4 | Testing + Docs | 11 | 46 |
| 5 | Quick Features | 5.5 | 51.5 |
| 6 | Major Features | 18 | 69.5 |
| 7 | Advanced Feature | 8 | 77.5 |

**Total: ~77.5 hours across 7 phases**

## Verification
- After Phase 1: Corrupt localStorage manually, import bad JSON, verify graceful handling
- After Phase 2: All features still work identically; open index.html and test each tab
- After Phase 3: Tab through entire app with keyboard only; test with screen reader
- After Phase 4: `npx vitest run` passes all tests
- After each feature phase: Manual smoke test of new functionality
