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

Estado: implementada en la vista “Revenue comparison” del dashboard; ver [components.md](components.md) para props y estados de renderizado.

### Endpoint y tipos

| Endpoint | Uso | Tipo de petición | Tipo de respuesta |
| --- | --- | --- | --- |
| `GET /api/metrics/facets` | Catálogo global de categorías y segmentos, cargado desde `App`. | Ninguno | `FacetsResponse`; `categories` no se separa por grupo. |
| `GET /api/metrics/categories/top` | Una petición por segmento para categorías de ingresos (máximo cinco). | `TopCategoriesParams` con `operation_type=income`, `limit=5` y `business_type=B2B` o `B2C`. | `TopCategoriesResponse`, arreglo de `CategoryEntry`. |
| `GET /api/metrics/b2b` y `GET /api/metrics/b2c` | Obtener todos los movimientos de ingreso del segmento para el total y denominador de porcentajes. | `DateRangeFilter` más `operation_type: "income"`; el path selecciona el segmento. | `FinancialMovement[]` desde `financial-types.ts`. |

La vista realiza cuatro solicitudes de datos (dos top y dos de movimientos), además de usar las facetas ya cargadas. `CategoryEntry` no incluye `business_type`; el segmento se conserva por la petición que originó cada arreglo. Las facetas son globales y no contienen una lista distinta por segmento; cada endpoint top devuelve como máximo cinco entradas para el segmento solicitado.

### Parámetros y restricciones

| Parámetro | Validez y restricciones |
| --- | --- |
| `business_type` en `/categories/top` | Opcional en la API; valores `B2B` o `B2C`. La comparación envía uno en cada petición. Si se omite, el endpoint mezcla segmentos. |
| `operation_type` para `/categories/top` | Opcional; `income` o `outcome`; default `outcome`. La comparación envía `income`. |
| `limit` | Opcional; entero entre `1` y `20`; default `5`. La comparación envía `5`; la API puede devolver menos entradas. |
| `start_date`, `end_date` | Opcionales, `YYYY-MM-DD`, inclusivos; deben ser los mismos en ambas peticiones y coincidir con el rango activo del dashboard. |
| `operation_type` para `/b2b` y `/b2c` | Opcional; `income` o `outcome`. La vista envía `income`; el segmento lo selecciona el path, no `business_type`. |

Cada `CategoryEntry` devuelve `category`, `operation_type` y `total_amount`; los segmentos se renderizan en tablas independientes, no alineadas fila a fila. Las categorías válidas son `suppliers`, `sales`, `operational`, `administrative` y `others`. El porcentaje usa `total_amount / totalIncome * 100`; `totalIncome` suma todos los movimientos `income` del segmento, no solo los top-5. Si el total es cero, la UI muestra `0.0%`.

### Casos límite

1. Un top devuelve menos de cinco entradas: mostrar solo las filas recibidas, sin rellenar categorías artificiales; la otra tabla se renderiza independientemente.
2. Un top devuelve `[]`: ese panel muestra “No income categories available.”; el otro panel conserva sus filas.
3. Ambos totales son cero: conservar el gráfico y mostrar “No income data available to compare.”; si hay filas, la participación calculada es `0.0%`.
4. Las categorías u órdenes difieren entre segmentos: cada tabla conserva el orden de su respuesta; la implementación no alinea filas ni añade placeholders.
5. Falla cualquiera de las cuatro solicitudes: mostrar error de comparación y no presentar el resultado parcial como completo.