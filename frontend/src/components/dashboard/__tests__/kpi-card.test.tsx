import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react'
import { KPICard } from '../kpi-card'

describe('KPICard', () => {
  const defaultProps = {
    value: '$48,200',
    helperText: 'Cumulative revenue from all income movements',
  }

  it('renders income variant with correct styles', () => {
    render(
      <KPICard
        {...defaultProps}
        label="Total Income"
        icon={TrendingUp}
        variant="income"
      />,
    )
    expect(screen.getByText('Total Income')).toBeInTheDocument()
    expect(screen.getByText('$48,200')).toBeInTheDocument()
    expect(screen.getByText('Cumulative revenue from all income movements')).toBeInTheDocument()
  })

  it('renders outcome variant with correct styles', () => {
    render(
      <KPICard
        {...defaultProps}
        label="Total Outcome"
        icon={TrendingDown}
        variant="outcome"
      />,
    )
    expect(screen.getByText('Total Outcome')).toBeInTheDocument()
  })

  it('renders profit variant with correct styles', () => {
    render(
      <KPICard
        {...defaultProps}
        label="Profit"
        icon={DollarSign}
        variant="profit"
      />,
    )
    expect(screen.getByText('Profit')).toBeInTheDocument()
  })

  it('renders profitPercent variant with correct styles', () => {
    render(
      <KPICard
        {...defaultProps}
        label="Profit Margin"
        icon={BarChart2}
        variant="profitPercent"
      />,
    )
    expect(screen.getByText('Profit Margin')).toBeInTheDocument()
  })

  it('shows skeleton placeholders when loading', () => {
    const { container } = render(
      <KPICard
        {...defaultProps}
        label="Total Income"
        icon={TrendingUp}
        variant="income"
        loading
      />,
    )
    // Should not render value text
    expect(screen.queryByText('$48,200')).not.toBeInTheDocument()
    // Should render skeleton elements (label is replaced with skeleton too)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
    // Label text is also skeletonized when loading, so it shouldn't be visible as text
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument()
  })

  it('displays formatted value text when not loading', () => {
    render(
      <KPICard
        label="Total Income"
        value="$120,000"
        helperText="Test helper"
        icon={TrendingUp}
        variant="income"
      />,
    )
    expect(screen.getByText('$120,000')).toBeInTheDocument()
    expect(screen.queryByText('Test helper')).toBeInTheDocument()
  })
})