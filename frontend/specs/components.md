# Contratos de componentes por funcionalidad

## Tipos compartidos

- [param-types.ts](param-types.ts) define parámetros de solicitud; [api-types.ts](api-types.ts) define las respuestas de API.
- `BusinessType`, `OperationType` y `Category` se reutilizan desde [financial-types.ts](../src/lib/financial-types.ts); sus literales no se redefinen en props.
- `App` es el propietario del rango compartido. Construye `DateRangeFilter` omitiendo campos vacíos y lo pasa a las solicitudes de métricas, alertas y comparación; nunca serializa `""` como fecha.
- Las respuestas-array se conservan como arreglos: `AlertsResponse` y `TopCategoriesResponse` no tienen un objeto envolvente.

## Funcionalidad 1: rango de fechas

### `App` y componentes de overview

Los controles de fecha están inline en `App`, que no recibe props. El mismo rango se aplica al overview y a la vista de comparación.

| Componente | Props reales | Renderizado condicional |
| --- | --- | --- |
| `App` | Sin props. Mantiene `startDate`, `endDate`, `availableRange`, `rangeError` y `activeView`. | Los inputs se deshabilitan hasta recibir facetas; el texto de referencia muestra carga, error o límites. El rango y la navegación permanecen visibles. Renderiza overview o comparación según `activeView`. |
| `KPIRow` | `metrics: KPIMetrics \| null`; `loading?: boolean` | Conserva tarjetas durante la carga; muestra valores cuando recibe métricas calculadas desde movimientos filtrados. |
| `IncomeOutcomeChart` | `data: MonthlyDataPoint[]`; `loading?: boolean` | Skeleton mientras carga; gráfico si hay importes, o “No data available to display” si no. |
| `ProfitPercentChart` | `data: MonthlyDataPoint[]`; `loading?: boolean` | Skeleton mientras carga; gráfico si algún margen es distinto de cero, o “No data available to display” en caso contrario. |

Las fechas elegibles se limitan a `FacetsResponse.min_date..max_date`; `start_date` no puede superar `end_date`. Los endpoints aplican límites inclusivos. Con un input vacío se omite solo su parámetro; con ambos vacíos se omiten ambos.

## Funcionalidad 2: alertas de anomalías

### `AnomalyAlertsTable`

Existe en [anomaly-alerts-table.tsx](../src/components/dashboard/anomaly-alerts-table.tsx). `MetricsAlert` de `financial-types.ts` es estructuralmente equivalente a `AlertEntry`.

| Prop real | Tipo | Renderizado condicional |
| --- | --- | --- |
| `threshold` | `string` | Borrador del input. Si es inválido muestra validación y no la tabla; si es válido permite sus estados. |
| `onThresholdChange` | `(value: string) => void` | Notifica el borrador; `App` solo consulta con el ratio validado `0.01–1.0`. |
| `alerts` | `MetricsAlert[]` (`AlertsResponse`) | Filas recibidas. Un arreglo vacío muestra mensaje explícito. |
| `loading` | `boolean` | Muestra “Loading alerts...” dentro de la tabla. |
| `error` | `string \| null` | Muestra el error en la tabla, separado del estado vacío. |

Decisiones para eliminar ambigüedades del brief:

- El umbral se interpreta como ratio, no como porcentaje: `0.3` significa `30%`. El control acepta `0.01–1.0`, aunque el endpoint declara solo mínimo `0`; el valor inicial es `0.3`.
- El input puede conservar temporalmente texto incompleto en estado local, pero solo emite un `threshold: number` válido en `AlertsParams` y nunca consulta con un valor inválido.
- La tabla usa `group_by: "month"` y muestra el `increase_ratio` multiplicado por 100.
- La API calcula `baseline_average` con los períodos anteriores del conjunto filtrado, no exclusivamente con los tres anteriores. La columna debe describirse como promedio histórico, no como media móvil de tres períodos.
- Una respuesta `[]` muestra un estado vacío explícito. No se oculta la tabla.

## Funcionalidad 3: comparación de categorías B2B vs. B2C

### `BusinessRevenueComparison`

Existe en [business-revenue-comparison.tsx](../src/components/dashboard/business-revenue-comparison.tsx) y se monta desde `App` cuando `activeView === "revenue-comparison"`.

| Prop real | Tipo | Contrato y renderizado condicional |
| --- | --- | --- |
| `dateRange` | `DateRangeFilter` | Rango compartido que se envía en las cuatro solicitudes cuando cada campo tiene valor. |
| `facets` | `FacetsResponse \| null` | Facetas globales; `null` mientras carga. `facets.categories` filtra categorías devueltas, no separa catálogos por segmento. |
| `facetsError` | `boolean` | Si es `true`, muestra “Available categories could not be loaded.” |

### `CategoryRevenueTable` (interno)

| Prop real | Tipo | Renderizado condicional |
| --- | --- | --- |
| `businessType` | `BusinessType` | Encabezado `B2B` o `B2C`. |
| `entries` | `TopCategoriesResponse` | Si está vacío, muestra “No income categories available.”; de otro modo, renderiza las entradas recibidas (hasta cinco). |
| `totalIncome` | `number` | Total del segmento y denominador de “Share of group”. Si vale `0`, la participación muestra `0.0%`. |

### `RevenueComparisonChart` (interno)

Recibe `data: RevenueChartPoint[]`, donde `RevenueChartPoint` es `{ businessType: BusinessType; totalIncome: number }`. Muestra barras si algún total es positivo; si ambos son cero, conserva el área y muestra “No income data available to compare.”

### Flujo de datos y estados de comparación

- `TopCategoriesParams`: dos solicitudes a `/api/metrics/categories/top`, con fechas iguales, `operation_type: "income"`, `limit: 5` y `business_type` distinto (`B2B`/`B2C`).
- Los totales se calculan con `/api/metrics/b2b` y `/api/metrics/b2c`, ambas con `operation_type=income` y el mismo rango opcional. Cada respuesta es `FinancialMovement[]`; el path selecciona el segmento.
- `/api/metrics/facets` entrega categorías globales, no catálogos por segmento. Cada endpoint top devuelve como máximo cinco entradas; las tablas no inventan filas para completar cinco.
- Sin facetas se muestra carga; con error de facetas o de cualquiera de las cuatro solicitudes se muestra error, no una comparación parcial. Si un top está vacío, solo ese panel muestra su estado vacío; el otro conserva sus filas.
- `CategoryEntry` no incluye `business_type`; el segmento proviene de la solicitud. El porcentaje se calcula como `total_amount / totalIncome * 100`, usando todos los movimientos de ingreso del segmento como denominador, no solo el top-5.

## Estados comunes

- Los errores se distinguen de los arreglos vacíos.
- Cuando cambian las fechas, la comparación no muestra como vigentes datos cargados para un rango anterior.