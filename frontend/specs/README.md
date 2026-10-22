# Fase 4: contratos de las funcionalidades

Los endpoints y esquemas siguientes se contrastaron con el OpenAPI servido por FastAPI en `/docs`. Los tipos compartidos están en [api-types.ts](api-types.ts), [param-types.ts](param-types.ts) y [financial-types.ts](../src/lib/financial-types.ts). Las props de UI están descritas en [components.md](components.md).

## 1. Filtro de rango de fechas

Estado: implementado en el dashboard principal.

### Endpoints y tipos

| Endpoint | Uso | Tipo de petición | Tipo de respuesta |
| --- | --- | --- | --- |
| `GET /api/metrics/facets` | Obtener límites disponibles y facetas. No recibe query params. | Ninguno | `FacetsResponse`; `min_date` y `max_date` son fechas ISO. |
| `GET /api/metrics` | Obtener los movimientos que alimentan los KPIs y gráficos. | `DateRangeFilter` para esta funcionalidad | `FinancialMovement[]` desde `financial-types.ts`. |

`FacetsResponse` también contiene `operation_types`, `business_types` y `categories`. El rango es dinámico; no debe codificarse un año fijo.

### Parámetros y restricciones

| Parámetro | Validez y restricciones |
| --- | --- |
| `start_date` | Opcional; fecha calendario `YYYY-MM-DD`, inclusiva. La UI la limita a `min_date..max_date`. |
| `end_date` | Opcional; fecha calendario `YYYY-MM-DD`, inclusiva. La UI la limita a `min_date..max_date` y evita que preceda a `start_date`. |
| `category` | El endpoint la admite, pero esta funcionalidad no expone ese filtro. Valores API: `suppliers`, `sales`, `operational`, `administrative`, `others`. |
| `operation_type` | El endpoint la admite, pero esta funcionalidad no expone ese filtro. Valores API: `income`, `outcome`. |

Los parámetros de fecha vacíos se omiten de la query. La API acepta fechas parseables y aplica límites inclusivos; el intervalo dentro del rango de facetas y el orden válido son restricciones de la UI.

### Casos límite

1. Ambos inputs vacíos: consultar `/api/metrics` sin `start_date` ni `end_date`; mostrar todos los datos disponibles y mantener visible el rango de referencia de facetas.
2. Solo uno de los inputs tiene valor: enviar únicamente ese límite y aplicar el filtro inclusivo correspondiente.
3. El rango válido no contiene movimientos: mantener el dashboard; los KPIs se recalculan con la respuesta vacía y los gráficos muestran su estado explícito de “No data available to display”.

## 2. Tabla de alertas de anomalías

Estado: tabla implementada debajo de los gráficos.

### Endpoint y tipos

| Endpoint | Tipo de petición | Tipo de respuesta |
| --- | --- | --- |
| `GET /api/metrics/alerts` | `AlertsParams` | `AlertsResponse`, un arreglo de `AlertEntry`. |

Cada entrada tiene `period`, `outcome_total`, `baseline_average` e `increase_ratio`. El último es ratio decimal; para mostrar porcentaje se multiplica por 100.

### Parámetros y restricciones

| Parámetro | Validez y restricciones |
| --- | --- |
| `threshold` | API: número `>= 0`, default `0.3`, sin máximo publicado. UI: ratio entre `0.01` y `1.0`, default `0.3`; no enviar drafts vacíos o inválidos. La alerta requiere `increase_ratio > threshold`, no igualdad. |
| `group_by` | `day`, `week` o `month`; default API `month`. El dashboard solicita `month`. |
| `start_date`, `end_date` | Opcionales, `YYYY-MM-DD`, inclusivos; reutilizan el rango activo de la Funcionalidad 1. |
| `business_type` | Opcional para la API; `B2B` o `B2C`. Esta tabla no ofrece selector y lo omite. |

La API define `baseline_average` como el promedio de todos los períodos anteriores del conjunto filtrado, no como media móvil de tres períodos. La interfaz lo etiqueta “Historical average”, conforme a [alertas-anomalias.md](alertas-anomalias.md).

### Casos límite

1. Umbral vacío, no numérico, menor que `0.01` o mayor que `1.0`: mostrar validación y no enviar la petición; no reutilizar la respuesta previa como si correspondiera al borrador inválido.
2. La API devuelve `[]` para el umbral o rango vigente: conservar encabezados y tabla y mostrar “No anomalies detected for this threshold and date range.”
3. Una alerta tiene incremento exactamente igual al umbral: no aparece, porque el backend compara con `>` estricto.
4. Falla la petición: mostrar estado de error separado del estado vacío.

## 3. Comparación de categorías B2B vs. B2C

Estado: la API y los tipos están disponibles; la tabla comparativa del frontend está prevista, todavía no integrada.

### Endpoint y tipos

| Endpoint | Tipo de petición | Tipo de respuesta |
| --- | --- | --- |
| `GET /api/metrics/categories/top` | `TopCategoriesParams` | `TopCategoriesResponse`, un arreglo de `CategoryEntry`. |

La comparación requiere dos peticiones: una con `business_type=B2B` y otra con `business_type=B2C`, compartiendo operación, límite y fechas. La respuesta es un arreglo plano y no incluye `business_type` en cada entrada; el segmento se conserva en la petición que originó cada arreglo.

### Parámetros y restricciones

| Parámetro | Validez y restricciones |
| --- | --- |
| `business_type` | Opcional en la API; valores `B2B` o `B2C`. Obligatorio en cada una de las dos peticiones de comparación. Si se omite, el endpoint mezcla ambos segmentos. |
| `operation_type` | Opcional; `income` o `outcome`; default `outcome`. Si el brief no añade un control, usar el default. |
| `limit` | Opcional; entero entre `1` y `20`; default `5`. Si el brief no añade un control, usar el default. |
| `start_date`, `end_date` | Opcionales, `YYYY-MM-DD`, inclusivos; deben ser los mismos en ambas peticiones y coincidir con el rango activo del dashboard. |

Cada `CategoryEntry` devuelve `category`, `operation_type` y `total_amount`. Las categorías válidas son `suppliers`, `sales`, `operational`, `administrative` y `others`.

### Casos límite

1. Las listas B2B y B2C tienen orden distinto: alinear las filas por `category`, nunca por índice ni ranking.
2. Una categoría falta en uno de los resultados top: mostrar `—` para ese segmento, no `0`; la categoría puede haber quedado fuera de `limit` y la respuesta no distingue ese caso de ausencia de movimientos.
3. Un segmento devuelve `[]`: conservar ambas columnas; mostrar `—` para sus categorías. Si ambos devuelven `[]`, mostrar un estado vacío explícito.
4. Falla una de las dos peticiones: mostrar error y no presentar una comparación parcial como completa.