import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { mockMovements } from '@/lib/mock-data'

// Mock lazy-loaded chart components to avoid Recharts rendering issues
vi.mock('@/components/dashboard/income-outcome-chart', () => ({
  IncomeOutcomeChart: ({ data, loading }: { data: unknown[]; loading?: boolean }) => (
    <div data-testid="income-outcome-chart">
      {loading ? 'loading...' : `chart with ${data.length} points`}
    </div>
  ),
}))

vi.mock('@/components/dashboard/profit-percent-chart', () => ({
  ProfitPercentChart: ({ data, loading }: { data: unknown[]; loading?: boolean }) => (
    <div data-testid="profit-percent-chart">
      {loading ? 'loading...' : `chart with ${data.length} points`}
    </div>
  ),
}))

describe('App Integration', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMovements),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the skip-to-content link', () => {
    render(<App />)

    const skipLink = screen.getByText('Skip to main content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink.getAttribute('href')).toBe('#main-content')
  })

  it('renders in dark mode', () => {
    const { container } = render(<App />)

    const main = container.querySelector('main')
    expect(main).toHaveClass('dark')
  })

  it('renders the dashboard header and KPIs after loading', async () => {
    render(<App />)

    expect(screen.getByText('Financial Overview')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument()
    })

    expect(screen.getByText('Total Outcome')).toBeInTheDocument()
    expect(screen.getByText('Profit')).toBeInTheDocument()
    expect(screen.getByText('Profit Margin')).toBeInTheDocument()

    expect(screen.getByTestId('income-outcome-chart')).toBeInTheDocument()
    expect(screen.getByTestId('profit-percent-chart')).toBeInTheDocument()
  })
})