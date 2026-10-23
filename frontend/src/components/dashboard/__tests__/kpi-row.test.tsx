import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KPIRow } from '../kpi-row'
import type { KPIMetrics } from '@/lib/financial-types'

describe('KPIRow', () => {
  const sampleMetrics: KPIMetrics = {
    totalIncome: 48200,
    totalOutcome: 18500,
    profit: 29700,
    profitPercent: 61.6,
  }

  it('renders four KPI cards with formatted values', () => {
    render(<KPIRow metrics={sampleMetrics} />)

    expect(screen.getByText('Total Income')).toBeInTheDocument()
    expect(screen.getByText('Total Outcome')).toBeInTheDocument()
    expect(screen.getByText('Profit')).toBeInTheDocument()
    expect(screen.getByText('Profit Margin')).toBeInTheDocument()

    expect(screen.getByText('$48,200')).toBeInTheDocument()
    expect(screen.getByText('$18,500')).toBeInTheDocument()
    expect(screen.getByText('$29,700')).toBeInTheDocument()
    expect(screen.getByText('61.6%')).toBeInTheDocument()
  })

  it('shows dash placeholders when metrics is null', () => {
    render(<KPIRow metrics={null} />)

    const dashes = screen.getAllByText('—')
    expect(dashes).toHaveLength(4)

    expect(screen.getByText('Total Income')).toBeInTheDocument()
    expect(screen.getByText('Total Outcome')).toBeInTheDocument()
  })

  it('passes loading prop to all KPI cards', () => {
    const { container } = render(<KPIRow metrics={null} loading />)

    // Loading skeletons should be present
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })

  it('renders correct grid layout classes', () => {
    const { container } = render(<KPIRow metrics={sampleMetrics} />)

    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid')
    expect(grid.className).toContain('grid-cols-1')
  })
})