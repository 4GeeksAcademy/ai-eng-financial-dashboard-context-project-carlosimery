import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock lazy-loaded chart components
vi.mock('@/components/dashboard/income-outcome-chart', () => ({
  IncomeOutcomeChart: () => <div data-testid="income-outcome-chart" />,
}))

vi.mock('@/components/dashboard/profit-percent-chart', () => ({
  ProfitPercentChart: () => <div data-testid="profit-percent-chart" />,
}))

describe('App Error State', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error alert when fetch fails (with retries)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    // Reset modules to clear the module-level fetchCache
    vi.resetModules()
    const AppModule = await import('../App')

    render(<AppModule.default />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    }, { timeout: 20000 })

    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
  }, 30000)
})