---
name: qa-dashboard-fullstack
description: Comprehensive testing and QA for this financial dashboard full-stack project (React + FastAPI). Covers unit tests with Vitest and Pytest, React component tests with Testing Library, API integration tests, accessibility testing with axe-core, E2E tests with Playwright, and QA validation patterns specific to dashboard/analytics applications. Use whenever the user asks to "add tests", "improve test coverage", "write unit tests", "test components", "integration testing", "E2E tests", "QA audit", "test the API", "increase code coverage", "write test cases", "validate data", or "test the dashboard".
metadata:
  version: "1.0.0"
  author: "Generated for ai-eng-financial-dashboard-context-project"
  domain: testing
  project: "Financial Dashboard — React 19 + FastAPI + Vite + Recharts"
  triggers: testing, QA, unit tests, Vitest, Pytest, React Testing Library, Playwright, coverage, TDD, component tests, API tests, E2E, accessibility tests
---

# QA & Testing — Financial Dashboard Full-Stack

## Project Context

You are auditing and generating tests for a **financial dashboard** with:
- **Frontend:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Recharts 3, Vitest 4
- **Backend:** Python 3.13, FastAPI, Pydantic, Pytest + pytest-cov + httpx
- **Data model:** `FinancialMovement` (create_date, amount, operation_type, category, business_type)
- **KPIs:** `totalIncome`, `totalOutcome`, `profit`, `profitPercent`
- **Charts:** Income vs Outcome (LineChart), Profit Margin % (LineChart)
- **State management:** `useState` + `useEffect` with retry, caching, and Suspense lazy loading

## Testing Pyramid for This Project

```
        ╱╲
       ╱E2E╲           ← Playwright: full user flows
      ╱─────╲
     ╱ Integ ╲         ← API contract + component integration
    ╱─────────╲
   ╱  Unit /   ╲       ← Pure functions + API route logic
  ╱  Component  ╲      ← React components with RTL
 ╱───────────────╲
╱   Static / Lint  ╲   ← TypeScript, ESLint
╱═══════════════════╲
```

## 1. Frontend — Vitest (Unit Tests)

### Configuration
Vitest is pre-configured via `vite.config.ts`. The `@/` alias resolves to `src/`. Test files follow the `*.test.ts` or `*.test.tsx` convention.

**Existing tests:** `src/lib/financial-utils.test.ts`

### Pure Function Tests (existing pattern to extend)
Test utility functions in `src/lib/`:
- `formatCurrency` — normal values, zero, negative, large numbers, edge cases
- `formatPercent` — 0%, 100%, negative, decimal rounding
- `computeKPIs` — mixed movements, only income, only outcome, empty array, single movement
- `computeMonthlyData` — cross-year data, unsorted data, single month, empty array
- `toYearMonthKey` — date edge cases (leap year, month boundaries)
- `formatMonthYearLabel` — locale formatting

### Component Tests (React Testing Library — NEW)
Test components in `src/components/`:
- **`kpi-card.tsx`** — renders all 4 variants, shows/hides skeleton during loading, displays formatted value
- **`kpi-row.tsx`** — passes metrics correctly to 4 cards, handles null metrics
- **`dashboard-header.tsx`** — renders period badge, handles missing period
- **`income-outcome-chart.tsx`** — renders chart with data, shows empty state when no data, shows skeleton when loading
- **`profit-percent-chart.tsx`** — same patterns as income chart
- **`App.tsx`** — integration test: mock fetch, verify KPIs + charts render, verify error state

**Setup for RTL:**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Add to `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts',
}
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

### Mocking Strategy
- **fetch:** Mock via `vi.spyOn(globalThis, 'fetch')` or `msw` (Mock Service Worker)
- **Recharts:** `ResponsiveContainer` needs manual width/height or a mock
- **lazy imports:** Use `vi.mock()` for components loaded via `React.lazy()`
- **Suspense:** Wrap in `<Suspense>` within test

### Accessibility Tests (axe-core)
```bash
npm install --save-dev vitest-axe
```

Add to setup:
```ts
import 'vitest-axe/extend-expect'
```

Test each component for WCAG violations:
```ts
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'

it('has no accessibility violations', async () => {
  const { container } = render(<KPICard ... />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Coverage Target
```bash
npm run test:coverage
```

Target thresholds (configure in `vite.config.ts`):
- `src/lib/` functions: 100% lines, 100% branches
- `src/components/` UI: 90% lines, 80% branches
- `src/App.tsx`: 80% lines
- Overall: 85% lines

## 2. Backend — Pytest (API Tests)

### Configuration
FastAPI `TestClient` in `conftest.py`. Tests use monkeypatching to replace `generate_mock_movements` with fixed data.

**Existing tests:** `tests/test_routes.py`

### API Endpoint Tests (extend coverage)
```bash
cd backend && python -m pytest -v --cov=app --cov-report=term-missing
```

**Endpoints to test:**
| Endpoint | Method | What to Test |
|----------|--------|-------------|
| `/api/metrics` | GET | Status 200, response shape, filters (start_date, end_date, category, operation_type, business_type) |
| `/api/metrics/b2b` | GET | Only B2B records, sorted by date, combined filters |
| `/api/metrics/b2c` | GET | Only B2C records, sorted by date |
| `/api/metrics/facets` | GET | Returns correct operation_types, business_types, categories, min/max date |
| `/api/metrics/summary` | GET | group_by (day/week/month), business_type filter, correct income/outcome/net |
| `/api/metrics/categories/top` | GET | Limit parameter, sorted by amount, operation_type filter |
| `/api/metrics/comparison` | GET | current/previous period, delta calculation, empty periods |
| `/api/metrics/alerts` | GET | Outcome spikes, threshold parameter |
| `/health` | GET | Status 200, returns `{"status": "ok"}` |

### Pydantic Model Tests
Test data validation:
- `FinancialMovement` — invalid date formats, negative amounts, invalid operation_type, missing required fields
- Edge cases: zero amounts, very large numbers, boundary dates

### Error Handling Tests
- Invalid query parameters (wrong types, out-of-range values)
- Malformed requests
- Missing required parameters
- Empty result sets (valid filters returning no data)

### Mock Data Tests
- `generate_mock_movements` — seeded reproducibility, correct count (360), sorted order, valid field ranges
- `filter_movements_by_date` — inclusive boundaries, no matches, full range

### Coverage Target
```bash
cd backend && python -m pytest --cov=app --cov-report=term-missing --cov-fail-under=95
```

Target: 95%+ coverage on `app/`

## 3. Integration Tests (Frontend + Backend)

### API Contract Tests
Test that frontend types match backend response shape:
```ts
// verify frontend FinancialMovement matches backend FinancialMovement
const response = await fetch('/api/metrics')
const data = response.json()
expectTypeOf(data).toMatchTypeOf<FinancialMovement[]>()
```

### Data Flow Integration
- Mock the full data flow: fetch → computeKPIs → render KPIRow → render charts
- Test the retry/cache logic in `App.tsx`
- Test error states (API down, timeout, 4xx, 5xx)

## 4. E2E Tests (Playwright)

### Setup
```bash
npm init playwright@latest -- --ct
```

### User Flows to Cover
1. **Dashboard loads** — Page renders KPIs, charts, and period indicator
2. **Loading state** — Skeleton placeholders visible while data loads
3. **Error state** — API failure shows error alert with role="alert"
4. **Responsive** — Viewport breakpoints (mobile 375px, tablet 768px, desktop 1280px)
5. **Dark mode** — Toggle/force dark mode, verify contrast
6. **Keyboard navigation** — Tab through all interactive elements, skip link works
7. **Charts render** — SVG elements visible with data

### Accessibility E2E
```bash
npm install --save-dev @axe-core/playwright
```

Run axe checks on full page:
```ts
const results = await new AxeBuilder({ page }).analyze()
expect(results.violations).toEqual([])
```

## 5. QA Patterns for Dashboard/Analytics Apps

### Data Validation
- **No zero division:** Verify `profitPercent = income > 0 ? (profit / income) * 100 : 0`
- **Consistent totals:** `profit === totalIncome - totalOutcome`
- **Monotonic dates:** Monthly data points must be chronological
- **No floating point surprises:** Format consistently (currency: 0 decimals, percent: 1 decimal)

### Empty States
| Component | Empty State |
|-----------|-------------|
| KPIRow | All values show `—` |
| IncomeOutcomeChart | "No data available to display" |
| ProfitPercentChart | "No data available to display" |

### Loading States
| Component | Loading State |
|-----------|--------------|
| KPICard | 3 skeleton lines (label, value, helperText) |
| IncomeOutcomeChart | Card with skeleton full-height |
| ProfitPercentChart | Card with skeleton full-height |
| App level | Suspense fallback with animate-pulse div |

### Error States
- API failure → alert with `role="alert"` and error message in Spanish
- Missing/null data → graceful fallbacks (nullish coalescing)

### Performance QA
- Recharts lazy loaded via `React.lazy()` → verify chunk splitting
- fetch with retry (3 attempts) + AbortController (10s timeout) → verify behavior
- Client cache (60s TTL) → verify cache hit vs miss

## 6. Running Tests

### Frontend
```bash
# All tests
cd frontend && npm run test

# Watch mode
cd frontend && npm run test:watch

# Coverage report
cd frontend && npm run test:coverage
```

### Backend
```bash
# All tests
cd backend && python -m pytest -v

# With coverage
cd backend && python -m pytest -v --cov=app --cov-report=term-missing
```

### Both (with Docker)
```bash
docker compose run --rm frontend npm run test
docker compose run --rm backend python -m pytest -v
```

## 7. Commit Checklist

Before committing test changes, verify:
- [ ] `npm run build` passes (TypeScript compilation)
- [ ] `npm run test` passes (frontend)
- [ ] `python -m pytest -v` passes (backend)
- [ ] No `.only` or `.skip` left in test files
- [ ] Console errors/warnings addressed
- [ ] Coverage meets project thresholds