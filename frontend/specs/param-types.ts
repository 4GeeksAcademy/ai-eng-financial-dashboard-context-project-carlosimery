import type {
  BusinessType,
  OperationType,
} from "../src/lib/financial-types";

export interface DateRangeFilter {
  /** Optional inclusive lower bound for `create_date`; any calendar date formatted as `YYYY-MM-DD`. */
  start_date?: string;
  /** Optional inclusive upper bound for `create_date`; any calendar date formatted as `YYYY-MM-DD`. */
  end_date?: string;
}

export interface AlertsParams extends DateRangeFilter {
  /** Optional nonnegative number with no API maximum; defaults to `0.3`. The dashboard UI restricts it to `0.01`–`1.0`. */
  threshold?: number;
  /** Optional grouping: `day`, `week`, or `month`; defaults to `month`. */
  group_by?: "day" | "week" | "month";
  /** Optional business segment: `B2B` or `B2C`; omit to include both. */
  business_type?: BusinessType;
}

export interface TopCategoriesParams extends DateRangeFilter {
  /** Optional operation type: `income` or `outcome`; defaults to `outcome`. */
  operation_type?: OperationType;
  /** Optional integer from `1` through `20`; defaults to `5`. */
  limit?: number;
  /** Optional business segment: `B2B` or `B2C`; omit to include both. */
  business_type?: BusinessType;
}