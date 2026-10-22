import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type BusinessType,
  type Category,
  type FinancialMovement,
} from "@/lib/financial-types";
import { formatCurrency, formatPercent } from "@/lib/financial-utils";
import type {
  FacetsResponse,
  TopCategoriesResponse,
} from "../../../specs/api-types";
import type {
  DateRangeFilter,
  TopCategoriesParams,
} from "../../../specs/param-types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const BUSINESS_TYPES: BusinessType[] = ["B2B", "B2C"];

interface BusinessRevenueComparisonProps {
  dateRange: DateRangeFilter;
  facets: FacetsResponse | null;
  facetsError: boolean;
}

interface ComparisonData {
  categories: Record<BusinessType, TopCategoriesResponse>;
  totalIncome: Record<BusinessType, number>;
}

interface LoadedComparison {
  key: string;
  data: ComparisonData;
}

interface ComparisonError {
  key: string;
  message: string;
}

function addDateRange(params: URLSearchParams, dateRange: DateRangeFilter) {
  if (dateRange.start_date) params.set("start_date", dateRange.start_date);
  if (dateRange.end_date) params.set("end_date", dateRange.end_date);
}

async function fetchTopCategories(
  businessType: BusinessType,
  dateRange: DateRangeFilter,
): Promise<TopCategoriesResponse> {
  const query: TopCategoriesParams = {
    ...dateRange,
    operation_type: "income",
    limit: 5,
    business_type: businessType,
  };
  const params = new URLSearchParams();
  if (query.operation_type) params.set("operation_type", query.operation_type);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.business_type) params.set("business_type", query.business_type);
  addDateRange(params, query);

  const response = await fetch(
    `${API_BASE_URL}/api/metrics/categories/top?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch ${businessType} top categories`);
  }
  return response.json();
}

async function fetchIncomeMovements(
  businessType: BusinessType,
  dateRange: DateRangeFilter,
): Promise<FinancialMovement[]> {
  const params = new URLSearchParams({ operation_type: "income" });
  addDateRange(params, dateRange);
  const segment = businessType === "B2B" ? "b2b" : "b2c";
  const response = await fetch(
    `${API_BASE_URL}/api/metrics/${segment}?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch ${businessType} income movements`);
  }
  return response.json();
}

function sumIncome(movements: FinancialMovement[]): number {
  const total = movements
    .filter((movement) => movement.operation_type === "income")
    .reduce((sum, movement) => sum + movement.amount, 0);
  return Math.round(total * 100) / 100;
}

interface CategoryRevenueTableProps {
  businessType: BusinessType;
  entries: TopCategoriesResponse;
  totalIncome: number;
}

function CategoryRevenueTable({
  businessType,
  entries,
  totalIncome,
}: CategoryRevenueTableProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{businessType}</CardTitle>
        <CardDescription>
          Total income: {formatCurrency(totalIncome)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="px-3 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Revenue
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Share of group
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="h-20 px-3 text-center text-muted-foreground"
                  >
                    No income categories available.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const share =
                    totalIncome > 0
                      ? (entry.total_amount / totalIncome) * 100
                      : 0;
                  return (
                    <tr
                      key={entry.category}
                      className="border-b border-border/60 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-3 py-3 text-left font-medium capitalize text-foreground"
                      >
                        {entry.category}
                      </th>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(entry.total_amount)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatPercent(share)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface RevenueChartPoint {
  businessType: BusinessType;
  totalIncome: number;
}

function RevenueComparisonChart({ data }: { data: RevenueChartPoint[] }) {
  const hasIncome = data.some((entry) => entry.totalIncome > 0);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Total income comparison
        </CardTitle>
        <CardDescription>Revenue across both business lines</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasIncome ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No income data available to compare.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="businessType"
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
              />
              <Bar
                dataKey="totalIncome"
                name="Total income"
                radius={[4, 4, 0, 0]}
              >
                <Cell fill="var(--chart-income)" />
                <Cell fill="var(--chart-profit)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function BusinessRevenueComparison({
  dateRange,
  facets,
  facetsError,
}: BusinessRevenueComparisonProps) {
  const startDate = dateRange.start_date;
  const endDate = dateRange.end_date;
  const requestKey = `${startDate ?? ""}|${endDate ?? ""}`;
  const [comparison, setComparison] = useState<LoadedComparison | null>(null);
  const [requestError, setRequestError] = useState<ComparisonError | null>(null);

  useEffect(() => {
    if (!facets) return;

    let isCurrentRequest = true;
    const currentDateRange: DateRangeFilter = {};
    if (startDate) currentDateRange.start_date = startDate;
    if (endDate) currentDateRange.end_date = endDate;

    Promise.all([
      fetchTopCategories("B2B", currentDateRange),
      fetchTopCategories("B2C", currentDateRange),
      fetchIncomeMovements("B2B", currentDateRange),
      fetchIncomeMovements("B2C", currentDateRange),
    ])
      .then(([b2bCategories, b2cCategories, b2bMovements, b2cMovements]) => {
        if (!isCurrentRequest) return;
        setComparison({
          key: requestKey,
          data: {
            categories: { B2B: b2bCategories, B2C: b2cCategories },
            totalIncome: {
              B2B: sumIncome(b2bMovements),
              B2C: sumIncome(b2cMovements),
            },
          },
        });
        setRequestError(null);
      })
      .catch(() => {
        if (!isCurrentRequest) return;
        setRequestError({
          key: requestKey,
          message: "Could not load the revenue comparison.",
        });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [facets, startDate, endDate, requestKey]);

  const currentComparison =
    comparison?.key === requestKey ? comparison.data : null;
  const currentError =
    requestError?.key === requestKey ? requestError.message : null;
  const loading = !facets ? !facetsError : !currentComparison && !currentError;

  let content;
  if (facetsError) {
    content = (
      <p className="text-sm text-destructive" role="alert">
        Available categories could not be loaded.
      </p>
    );
  } else if (loading) {
    content = (
      <p className="py-12 text-center text-sm text-muted-foreground" role="status">
        Loading revenue comparison...
      </p>
    );
  } else if (currentError) {
    content = (
      <p className="py-12 text-center text-sm text-destructive" role="alert">
        {currentError}
      </p>
    );
  } else if (facets && currentComparison) {
    const availableCategories = new Set<Category>(facets.categories);
    const categoriesByBusinessType = {
      B2B: currentComparison.categories.B2B.filter((entry) =>
        availableCategories.has(entry.category),
      ),
      B2C: currentComparison.categories.B2C.filter((entry) =>
        availableCategories.has(entry.category),
      ),
    };
    const chartData = BUSINESS_TYPES.map((businessType) => ({
      businessType,
      totalIncome: currentComparison.totalIncome[businessType],
    }));

    content = (
      <>
        <section
          aria-label="Top income categories by business line"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {BUSINESS_TYPES.map((businessType) => (
            <CategoryRevenueTable
              key={businessType}
              businessType={businessType}
              entries={categoriesByBusinessType[businessType]}
              totalIncome={currentComparison.totalIncome[businessType]}
            />
          ))}
        </section>
        <RevenueComparisonChart data={chartData} />
      </>
    );
  }

  return (
    <section aria-labelledby="revenue-comparison-title" className="flex flex-col gap-4">
      <header>
        <h2
          id="revenue-comparison-title"
          className="text-lg font-semibold text-foreground"
        >
          Revenue by business line
        </h2>
      </header>
      {content}
    </section>
  );
}