import { lazy, Suspense, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import type { FinancialMovement, KPIMetrics, MonthlyDataPoint } from "@/lib/financial-types";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";

const IncomeOutcomeChart = lazy(() =>
  import("@/components/dashboard/income-outcome-chart").then((m) => ({
    default: m.IncomeOutcomeChart,
  })),
);
const ProfitPercentChart = lazy(() =>
  import("@/components/dashboard/profit-percent-chart").then((m) => ({
    default: m.ProfitPercentChart,
  })),
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const fetchCache = new Map<string, { data: FinancialMovement[]; ts: number }>();
const CACHE_TTL = 60_000;

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const cached = fetchCache.get("metrics");
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(`${API_BASE_URL}/api/metrics`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: FinancialMovement[] = await response.json();
      fetchCache.set("metrics", { data, ts: Date.now() });
      return data;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 1_000 * 2 ** attempt));
    }
  }
  throw new Error("Unreachable");
}

function App() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData()
      .then((movements) => {
        setMetrics(computeKPIs(movements));
        setMonthlyData(computeMonthlyData(movements));
      })
      .catch(() => {
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const period = loading
    ? "Loading..."
    : monthlyData.length > 0
      ? `${monthlyData[0].month} - ${monthlyData[monthlyData.length - 1].month}`
      : "No data";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <main id="main-content" className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader period={period} />

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground"
            >
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
            <Suspense
              fallback={
                <div className="h-[280px] rounded-lg bg-muted/30 animate-pulse" />
              }
            >
              <IncomeOutcomeChart data={monthlyData} loading={loading} />
            </Suspense>
            <Suspense
              fallback={
                <div className="h-[280px] rounded-lg bg-muted/30 animate-pulse" />
              }
            >
              <ProfitPercentChart data={monthlyData} loading={loading} />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
    </>
  );
}

export default App;
