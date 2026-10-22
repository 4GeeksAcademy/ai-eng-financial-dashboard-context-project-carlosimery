import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";
import {
  type FinancialMovement,
  type KPIMetrics,
  type MetricsFacets,
  type MonthlyDataPoint,
} from "@/lib/financial-types";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchFinancialData(
  startDate?: string,
  endDate?: string,
): Promise<FinancialMovement[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const query = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/api/metrics${query ? `?${query}` : ""}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

async function fetchMetricsFacets(): Promise<MetricsFacets> {
  const response = await fetch(`${API_BASE_URL}/api/metrics/facets`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics facets: ${response.status}`);
  }
  return response.json();
}

function App() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availableRange, setAvailableRange] = useState<MetricsFacets | null>(
    null,
  );
  const [rangeError, setRangeError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetricsFacets()
      .then(setAvailableRange)
      .catch(() => setRangeError(true));
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;

    fetchFinancialData(startDate || undefined, endDate || undefined)
      .then((movements) => {
        if (!isCurrentRequest) return;
        setMetrics(computeKPIs(movements));
        setMonthlyData(computeMonthlyData(movements));
      })
      .catch(() => {
        if (!isCurrentRequest) return;
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [startDate, endDate]);

  const period = loading
    ? "Loading..."
    : monthlyData.length > 0
      ? `${monthlyData[0].month} - ${monthlyData[monthlyData.length - 1].month}`
      : "No data";

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader period={period} />

          <section
            aria-label="Date filters"
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm font-medium text-foreground">
                <span className="mb-1 block">Start date</span>
                <input
                  type="date"
                  value={startDate}
                  min={availableRange?.min_date}
                  max={endDate || availableRange?.max_date}
                  disabled={!availableRange}
                  onChange={(event) => {
                    setLoading(true);
                    setError(null);
                    setStartDate(event.target.value);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                <span className="mb-1 block">End date</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || availableRange?.min_date}
                  max={availableRange?.max_date}
                  disabled={!availableRange}
                  onChange={(event) => {
                    setLoading(true);
                    setError(null);
                    setEndDate(event.target.value);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setStartDate("");
                  setEndDate("");
                }}
                disabled={!startDate && !endDate}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear dates
              </button>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {availableRange
                ? `Available: ${availableRange.min_date} to ${availableRange.max_date}`
                : rangeError
                  ? "Available date range could not be loaded."
                  : "Loading available date range..."}
            </p>
          </section>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
              {error}
            </div>
          ) : null}

          <section aria-label="Key performance indicators">
            <KPIRow metrics={metrics} loading={loading} />
          </section>

          <section
            aria-label="Financial charts"
            className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            <IncomeOutcomeChart data={monthlyData} loading={loading} />
            <ProfitPercentChart data={monthlyData} loading={loading} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
