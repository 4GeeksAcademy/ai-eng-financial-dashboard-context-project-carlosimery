import type {
  BusinessType,
  Category,
  OperationType,
} from "../src/lib/financial-types";

export interface FacetsResponse {
  /** Available operation types: `income` or `outcome`. */
  operation_types: OperationType[];
  /** Available business segments: `B2B` or `B2C`. */
  business_types: BusinessType[];
  /** Available categories: `suppliers`, `sales`, `operational`, `administrative`, or `others`. */
  categories: Category[];
  /** Earliest dataset date, formatted as `YYYY-MM-DD`. */
  min_date: string;
  /** Latest dataset date, formatted as `YYYY-MM-DD`. */
  max_date: string;
}

export interface AlertEntry {
  /** Group key: `YYYY-MM-DD` for day, `YYYY-Www` for week, or `YYYY-MM` for month (default). */
  period: string;
  /** Outcome total for this period, rounded to two decimal places; OpenAPI declares a number. */
  outcome_total: number;
  /** Mean of all earlier outcome periods in the filtered series, rounded to two decimal places. */
  baseline_average: number;
  /** Relative increase over `baseline_average` (not a percent), rounded to four decimals; returned alerts exceed the query threshold. */
  increase_ratio: number;
}

export type AlertsResponse = AlertEntry[];

export interface CategoryEntry {
  /** Category: `suppliers`, `sales`, `operational`, `administrative`, or `others`. */
  category: Category;
  /** Operation type: `income` or `outcome`. */
  operation_type: OperationType;
  /** Total amount for this category and operation type, rounded to two decimal places; OpenAPI declares a number. */
  total_amount: number;
}

// `business_type` selects B2B or B2C in the request; it is not returned per entry.
export type TopCategoriesResponse = CategoryEntry[];