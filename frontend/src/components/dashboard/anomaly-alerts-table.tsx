import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type MetricsAlert } from "@/lib/financial-types";
import { formatCurrency, formatPercent } from "@/lib/financial-utils";

interface AnomalyAlertsTableProps {
  threshold: string;
  onThresholdChange: (value: string) => void;
  alerts: MetricsAlert[];
  loading: boolean;
  error: string | null;
}

export function AnomalyAlertsTable({
  threshold,
  onThresholdChange,
  alerts,
  loading,
  error,
}: AnomalyAlertsTableProps) {
  const thresholdValue = Number(threshold);
  const thresholdIsValid =
    threshold.trim() !== "" &&
    Number.isFinite(thresholdValue) &&
    thresholdValue >= 0.01 &&
    thresholdValue <= 1;

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">Anomaly alerts</CardTitle>
        <label
          htmlFor="alert-threshold"
          className="flex items-center gap-3 text-sm font-medium text-foreground"
        >
          Alert threshold
          <input
            id="alert-threshold"
            type="number"
            min="0.01"
            max="1.0"
            step="0.01"
            value={threshold}
            aria-invalid={!thresholdIsValid}
            onChange={(event) => onThresholdChange(event.target.value)}
            className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </CardHeader>
      <CardContent>
        {!thresholdIsValid ? (
          <p className="py-8 text-center text-sm text-destructive" role="alert">
            Enter a ratio between 0.01 and 1.0.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th scope="col" className="px-3 py-3 font-medium">
                    Period
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Recorded outcome
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Historical average
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Increase
                  </th>
                </tr>
              </thead>
              <tbody aria-live="polite">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-20 px-3 text-center text-muted-foreground"
                    >
                      Loading alerts...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-20 px-3 text-center text-destructive"
                      role="alert"
                    >
                      {error}
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-20 px-3 text-center text-muted-foreground"
                    >
                      No anomalies detected for this threshold and date range.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr
                      key={alert.period}
                      className="border-b border-border/60 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-3 py-3 text-left font-medium text-foreground"
                      >
                        {alert.period}
                      </th>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(alert.outcome_total)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(alert.baseline_average)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums text-destructive">
                        {formatPercent(alert.increase_ratio * 100)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}