import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IncomeOutcomeChart } from '../income-outcome-chart'
import type { MonthlyDataPoint } from '@/lib/financial-types'

// Mock ResponsiveContainer to render children directly in jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '100%', height: 280 }}>{children}</div>
    ),
  }
})

const sampleData: MonthlyDataPoint[] = [
  { month: 'Jan 2024', income: 48200, outcome: 18500, profitPercent: 61.6 },
  { month: 'Feb 2024', income: 52800, outcome: 21000, profitPercent: 60.2 },
  { month: 'Mar 2024', income: 67400, outcome: 24500, profitPercent: 63.6 },
]

describe('IncomeOutcomeChart', () => {
  it('renders the card title and description', () => {
    render(<IncomeOutcomeChart data={sampleData} />)

    expect(screen.getByText('Income vs. Outcome')).toBeInTheDocument()
    expect(screen.getByText('Monthly revenue and expenditure evolution')).toBeInTheDocument()
  })

  it('renders skeleton placeholders when loading', () => {
    const { container } = render(<IncomeOutcomeChart data={[]} loading />)

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('shows empty state when all values are zero', () => {
    const emptyData: MonthlyDataPoint[] = [
      { month: 'Jan 2024', income: 0, outcome: 0, profitPercent: 0 },
    ]

    render(<IncomeOutcomeChart data={emptyData} />)

    expect(screen.getByText('No data available to display')).toBeInTheDocument()
  })

  it('renders the chart with data', () => {
    const { container } = render(<IncomeOutcomeChart data={sampleData} />)

    // Should not show empty state
    expect(screen.queryByText('No data available to display')).not.toBeInTheDocument()

    // Should render the figure with aria-label
    const figure = container.querySelector('figure')
    expect(figure).toBeInTheDocument()
    expect(figure).toHaveAttribute('aria-label', expect.stringContaining('chart'))
  })
})