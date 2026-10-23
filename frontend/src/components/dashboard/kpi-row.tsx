import { KPICard } from './kpi-card'
import { type KPIMetrics } from '@/lib/financial-types'
import { formatCurrency, formatPercent } from '@/lib/financial-utils'
import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react'

interface KPIRowProps {
  metrics: KPIMetrics | null
  loading?: boolean
}

export function KPIRow({ metrics, loading }: KPIRowProps) {
  const display = metrics
    ? {
        totalIncome: formatCurrency(metrics.totalIncome),
        totalOutcome: formatCurrency(metrics.totalOutcome),
        profit: formatCurrency(metrics.profit),
        profitPercent: formatPercent(metrics.profitPercent),
      }
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KPICard
        label="Total Income"
        value={display?.totalIncome ?? '—'}
        helperText="Cumulative revenue from all income movements"
        icon={TrendingUp}
        variant="income"
        loading={loading}
      />
      <KPICard
        label="Total Outcome"
        value={display?.totalOutcome ?? '—'}
        helperText="Total expenditure across all categories"
        icon={TrendingDown}
        variant="outcome"
        loading={loading}
      />
      <KPICard
        label="Profit"
        value={display?.profit ?? '—'}
        helperText="Net profit — income minus total outcome"
        icon={DollarSign}
        variant="profit"
        loading={loading}
      />
      <KPICard
        label="Profit Margin"
        value={display?.profitPercent ?? '—'}
        helperText="Profit as a percentage of total income"
        icon={BarChart2}
        variant="profitPercent"
        loading={loading}
      />
    </div>
  )
}
