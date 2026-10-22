# Contratos de componentes por funcionalidad

## Tipos compartidos

- [param-types.ts](param-types.ts) define parámetros de solicitud; [api-types.ts](api-types.ts) define las respuestas de API.
- `BusinessType`, `OperationType` y `Category` se reutilizan desde [financial-types.ts](../src/lib/financial-types.ts); sus literales no se redefinen en props.
- Los componentes reciben objetos con esos tipos, en vez de duplicar campos de query en props independientes.
- El rango de fechas es compartido. Un input vacío se normaliza como propiedad omitida, nunca como `""` en la query string.
- Las respuestas-array se conservan como arreglos: `AlertsResponse` y `TopCategoriesResponse` no tienen un objeto envolvente.

## Funcionalidad 1: rango de fechas

### `DateRangeFilterControls`

Estado: los inputs están actualmente inline en `App`; este es el contrato de props para esa sección/componente.

| Prop | Tipo | Contrato |
| --- | --- | --- |
| `value` | `DateRangeFilter` | Selección vigente. `start_date` y `end_date` son opcionales y usan `YYYY-MM-DD`. |
| `availableRange` | `Pick<FacetsResponse, "min_date" \| "max_date"> \| null` | Límites de calendario recibidos de `/api/metrics/facets`; `null` mientras se cargan o si no están disponibles. |
| `onChange` | `(value: DateRangeFilter) => void` | Emite el rango actualizado, omitiendo la propiedad cuyo input queda vacío. |
| `disabled?` | `boolean` | Deshabilita ambos inputs mientras los límites no estén disponibles. |

Las fechas se seleccionan dentro de `availableRange`; `start_date` no puede superar `end_date`. Los límites son inclusivos en los endpoints. El propietario del estado comparte `value` con las solicitudes de movimientos, alertas y categorías; no mantiene un rango distinto por tabla.

## Funcionalidad 2: alertas de anomalías

### `AnomalyAlertsTable`

Estado: existe en [anomaly-alerts-table.tsx](../src/components/dashboard/anomaly-alerts-table.tsx). El contrato siguiente alinea sus props públicas con los tipos de query y respuesta. El control puede conservar localmente un borrador de texto; solo el valor numérico validado forma parte de `AlertsParams`.

| Prop | Tipo | Contrato |
| --- | --- | --- |
| `params` | `AlertsParams` | Parámetros vigentes para `/api/metrics/alerts`; incluye el rango de fechas compartido y el ratio numérico. |
| `onParamsChange` | `(params: AlertsParams) => void` | Emite cambios válidos del umbral sin descartar las fechas ni otros parámetros vigentes. |
| `data` | `AlertsResponse` | Filas devueltas por el endpoint. |
| `loading` | `boolean` | Mientras sea `true`, muestra estado de carga en el área de tabla. |
| `error` | `string \| null` | Error de consulta; no se debe presentar como lista vacía. |

Decisiones para eliminar ambigüedades del brief:

- El umbral se interpreta como ratio, no como porcentaje: `0.3` significa `30%`. El control acepta `0.01–1.0`, aunque el endpoint declara solo mínimo `0`; el valor inicial es `0.3`.
- El input puede conservar temporalmente texto incompleto en estado local, pero solo emite un `threshold: number` válido en `AlertsParams` y nunca consulta con un valor inválido.
- La tabla usa `group_by: "month"` y muestra el `increase_ratio` multiplicado por 100.
- La API calcula `baseline_average` con los períodos anteriores del conjunto filtrado, no exclusivamente con los tres anteriores. La columna debe describirse como promedio histórico, no como media móvil de tres períodos.
- Una respuesta `[]` muestra un estado vacío explícito. No se oculta la tabla.

## Funcionalidad 3: comparación de categorías B2B vs. B2C

### `TopCategoriesComparison`

Estado: componente previsto; los tipos API y de query existen, pero el dashboard aún no implementa esta tabla.

| Prop | Tipo | Contrato |
| --- | --- | --- |
| `filters` | `Omit<TopCategoriesParams, "business_type">` | Parámetros comunes a ambos segmentos: operación, límite y rango de fechas. |
| `categories` | `FacetsResponse["categories"]` | Categorías disponibles; define el orden estable de las filas. |
| `dataByBusinessType` | `Record<BusinessType, TopCategoriesResponse>` | Arreglos separados para las claves `B2B` y `B2C`. |
| `loading` | `boolean` | Indica que una o ambas solicitudes comparativas están pendientes. |
| `error` | `string \| null` | Si falla cualquiera de las dos solicitudes, informa el error y no presenta la comparación como completa. |
| `onFiltersChange` | `(filters: Omit<TopCategoriesParams, "business_type">) => void` | Emite cambios a los filtros comunes sin cambiar el segmento de cada solicitud. |

Reglas de composición:

1. Ejecutar dos solicitudes a `/api/metrics/categories/top` con los mismos filtros comunes y `business_type: "B2B"` y `business_type: "B2C"`, respectivamente. Aunque el parámetro sea opcional en la API, ambas llamadas deben especificarlo; omitirlo mezcla los segmentos.
2. Si el brief no expone controles de operación o límite, usar los defaults de API: `operation_type: "outcome"` y `limit: 5`. El rango de fechas común sí se conserva.
3. `CategoryEntry` no incluye `business_type`; el segmento se obtiene de la clave de `dataByBusinessType`, no se inventa en cada fila.
4. Emparejar importes por `category`, nunca por índice: cada respuesta se ordena por su propio `total_amount`.
5. Mostrar una fila por categoría disponible. Si una categoría no aparece en la respuesta top de uno de los segmentos, mostrar `—`, no `0`: puede haber quedado fuera del límite y la API no distingue esa causa de una ausencia de movimientos.

## Estados comunes

- `loading`: conservar la estructura del componente y mostrar una indicación de carga.
- `error`: mostrar el error; no reutilizar datos de una solicitud anterior como si correspondieran a los filtros vigentes.
- vacío: mantener el encabezado/tabla y explicar que no hay resultados para esos filtros.