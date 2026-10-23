# Test Templates — Quick Copy/Paste

## Frontend — Component Test (RTL)

```tsx
// src/components/dashboard/__tests__/kpi-card.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KPICard } from '../kpi-card'
import { TrendingUp } from 'lucide-react'

describe('KPICard', () => {
  const defaultProps = {
    label: 'Total Income',
    value: '$1,500',
    helperText: 'Revenue from sales',
    icon: TrendingUp,
    variant: 'income' as const,
  }

  it('renders label and formatted value', () => {
    render(<KPICard {...defaultProps} />)
    expect(screen.getByText('Total Income')).toBeInTheDocument()
    expect(screen.getByText('$1,500')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = render(<KPICard {...defaultProps} loading />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
    expect(screen.queryByText('$1,500')).not.toBeInTheDocument()
  })

  it('renders all 4 variants without error', () => {
    const variants = ['income', 'outcome', 'profit', 'profitPercent'] as const
    for (const variant of variants) {
      const { unmount } = render(
        <KPICard {...defaultProps} variant={variant} />
      )
      expect(screen.getByText('Total Income')).toBeInTheDocument()
      unmount()
    }
  })
})
```

```tsx
// src/components/dashboard/__tests__/income-outcome-chart.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IncomeOutcomeChart } from '../income-outcome-chart'

const sampleData = [
  { month: 'Jan 2024', income: 1000, outcome: 400, profitPercent: 60 },
  { month: 'Feb 2024', income: 1500, outcome: 600, profitPercent: 60 },
]

describe('IncomeOutcomeChart', () => {
  it('renders chart title and description', () => {
    render(<IncomeOutcomeChart data={sampleData} />)
    expect(screen.getByText('Income vs. Outcome')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<IncomeOutcomeChart data={[]} />)
    expect(screen.getByText('No data available to display')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = render(<IncomeOutcomeChart data={[]} loading />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })
})
```

## Frontend — Pure Function Test (extend existing)

```ts
// src/lib/__tests__/financial-utils-edge-cases.test.ts
import { describe, expect, it } from 'vitest'
import { formatCurrency, formatPercent, computeKPIs } from '../financial-utils'

describe('formatCurrency edge cases', () => {
  it('handles zero', () => expect(formatCurrency(0)).toBe('$0'))
  it('handles negative', () => expect(formatCurrency(-500)).toBe('-$500'))
  it('handles large numbers', () => expect(formatCurrency(1_234_567)).toBe('$1,234,567'))
  it('rounds correctly', () => expect(formatCurrency(999.5)).toBe('$1,000'))
})

describe('computeKPIs edge cases', () => {
  it('returns zeros for empty array', () => {
    const kpis = computeKPIs([])
    expect(kpis).toEqual({ totalIncome: 0, totalOutcome: 0, profit: 0, profitPercent: 0 })
  })

  it('handles only income', () => {
    const kpis = computeKPIs([{
      create_date: '2024-01-01',
      amount: 1000,
      operation_type: 'income',
      category: 'sales',
      business_type: 'B2B',
    }])
    expect(kpis.totalIncome).toBe(1000)
    expect(kpis.totalOutcome).toBe(0)
    expect(kpis.profitPercent).toBe(100)
  })
})
```

## Backend — Pytest (extend existing)

```python
# backend/tests/test_models.py
import pytest
from pydantic import ValidationError
from app.routes import FinancialMovement

class TestFinancialMovementValidation:
    def test_valid_movement(self):
        m = FinancialMovement(
            create_date="2024-01-15",
            amount=100.50,
            operation_type="income",
            category="sales",
            business_type="B2B",
        )
        assert m.amount == 100.50

    def test_rejects_invalid_operation_type(self):
        with pytest.raises(ValidationError):
            FinancialMovement(
                create_date="2024-01-15",
                amount=100,
                operation_type="invalid",  # not income/outcome
                category="sales",
                business_type="B2B",
            )

    def test_rejects_negative_amount(self):
        with pytest.raises(ValidationError):
            FinancialMovement(
                create_date="2024-01-15",
                amount=-100,
                operation_type="income",
                category="sales",
                business_type="B2B",
            )
```

```python
# backend/tests/test_error_handling.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestErrorHandling:
    def test_invalid_date_format_returns_422(self):
        response = client.get("/api/metrics", params={"start_date": "not-a-date"})
        assert response.status_code == 422

    def test_invalid_operation_type_returns_422(self):
        response = client.get("/api/metrics", params={"operation_type": "invalid"})
        assert response.status_code == 422

    def test_empty_result_set_returns_200_with_empty_list(self):
        response = client.get("/api/metrics", params={"category": "nonexistent"})
        assert response.status_code == 200
        assert response.json() == []
```

## Frontend — Accessibility Test (axe-core)

```tsx
// src/components/dashboard/__tests__/kpi-row.a11y.test.tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { KPIRow } from '../kpi-row'
import type { KPIMetrics } from '@/lib/financial-types'

const mockMetrics: KPIMetrics = {
  totalIncome: 50000,
  totalOutcome: 20000,
  profit: 30000,
  profitPercent: 60,
}

describe('KPIRow accessibility', () => {
  it('has no WCAG violations', async () => {
    const { container } = render(<KPIRow metrics={mockMetrics} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no WCAG violations when loading', async () => {
    const { container } = render(<KPIRow metrics={null} loading />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## Vitest Config Update

```ts
// Add to vite.config.ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'html'],
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/**/*.test.*', 'src/test/**', 'src/main.tsx'],
    thresholds: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },
}
```