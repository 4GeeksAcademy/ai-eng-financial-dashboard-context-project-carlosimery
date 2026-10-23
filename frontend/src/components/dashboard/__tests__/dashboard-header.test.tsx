import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardHeader } from '../dashboard-header'

describe('DashboardHeader', () => {
  it('renders the title and description', () => {
    render(<DashboardHeader />)

    expect(screen.getByText('Financial Overview')).toBeInTheDocument()
    expect(screen.getByText('Executive metrics dashboard')).toBeInTheDocument()
  })

  it('renders the period badge with default text', () => {
    render(<DashboardHeader />)

    const badge = screen.getByText('No data')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('inline-flex')
  })

  it('renders the period badge with provided period', () => {
    render(<DashboardHeader period="Jan 2024 - Dec 2024" />)

    const badge = screen.getByText('Jan 2024 - Dec 2024')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveAttribute('aria-label', 'Reporting period: Jan 2024 - Dec 2024')
  })

  it('renders the LayoutDashboard icon with aria-hidden', () => {
    const { container } = render(<DashboardHeader />)

    const iconContainer = container.querySelector('span[aria-hidden="true"]')
    expect(iconContainer).toBeInTheDocument()
    // Lucide renders an SVG inside
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument()
  })

  it('renders the header element with correct structure', () => {
    const { container } = render(<DashboardHeader period="Test" />)

    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header?.className).toContain('flex')

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Financial Overview')
  })
})