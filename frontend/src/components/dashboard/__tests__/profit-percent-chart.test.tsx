import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfitPercentChart } from '../profit-percent-chart'
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

describe('ProfitPercentChart', () => {
  it('renders the card title and description', () => {
    render(<ProfitPercentChart data={sampleData} />)

    expect(screen.getByText('Profit Margin %')).toBeInTheDocument()
    expect(screen.getByText('Monthly profit as a percentage of total income')).toBeInTheDocument()
  })

  it('renders skeleton placeholders when loading', () => {
    const { container } = render(<ProfitPercentChart data={[]} loading />)

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('shows empty state when all profitPercent values are zero', () => {
    const emptyData: MonthlyDataPoint[] = [
      { month: 'Jan 2024', income: 0, outcome: 0, profitPercent: 0 },
    ]

    render(<ProfitPercentChart data={emptyData} />)

    expect(screen.getByText('No data available to display')).toBeInTheDocument()
  })

  it('renders the chart with data', () => {
    const { container } = render(<ProfitPercentChart data={sampleData} />)

    // Should not show empty state
    expect(screen.queryByText('No data available to display')).not.toBeInTheDocument()

    // Should render the figure with aria-label
    const figure = container.querySelector('figure')
    expect(figure).toBeInTheDocument()
    expect(figure).toHaveAttribute('aria-label', expect.stringContaining('Profit Margin'))
  })
})