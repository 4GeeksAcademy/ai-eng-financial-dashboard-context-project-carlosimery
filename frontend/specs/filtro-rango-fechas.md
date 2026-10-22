# Filtro de rango de fechas del dashboard

## Objetivo

Permitir que el usuario limite los datos visibles del dashboard principal a un intervalo de fechas, conociendo el rango disponible en el dataset.

## Alcance

El filtro afecta todos los indicadores y gráficos que actualmente se calculan a partir de los movimientos de `GET /api/metrics`: ingresos, gastos, beneficio, margen y series mensuales. No añade nuevas métricas ni modifica las fórmulas existentes.

## Interfaz

- Mostrar dos inputs de fecha cerca de la parte superior del dashboard: fecha de inicio y fecha de fin.
- Ambos inputs son opcionales. Si uno está vacío, solo se aplica el límite indicado por el otro; si ambos están vacíos, se muestran todos los movimientos disponibles.
- Mostrar junto a los inputs las fechas mínima y máxima disponibles, obtenidas del dataset.
- Restringir las fechas elegibles al rango disponible y evitar que la fecha de inicio sea posterior a la fecha de fin.
- Permitir limpiar los dos valores para volver a mostrar todos los datos.
- Al cambiar el rango, actualizar los KPIs y ambos gráficos con los movimientos devueltos por la API.

## Terminología de producto y contrato

El wording del requerimiento describe conceptos de interfaz; no todos corresponden a propiedades literales de la respuesta API.

| Wording del requerimiento | Nombre real en la API | Aclaración |
| --- | --- | --- |
| Fecha de inicio | `start_date` | Parámetro query opcional de `GET /api/metrics`. |
| Fecha de fin | `end_date` | Parámetro query opcional de `GET /api/metrics`. |
| Fecha más antigua disponible | `min_date` | Propiedad de `GET /api/metrics/facets`; no se llama `start_date`. |
| Fecha más reciente disponible | `max_date` | Propiedad de `GET /api/metrics/facets`; no se llama `end_date`. |
| Ingresos y gastos | `amount` agrupado por `operation_type` | Cada movimiento usa `operation_type: "income"` o `"outcome"`; la respuesta no contiene totales de ingresos/gastos. |
| Beneficio y margen | Valores derivados en el frontend | `/api/metrics` no devuelve campos `profit` o `profit_percent`; se calculan a partir de los movimientos filtrados. |

`GET /api/metrics/summary`, aunque existe, devuelve `period`, `income`, `outcome` y `net`; no devuelve margen y no es la fuente que consume actualmente el dashboard. La frase «todos los datos mostrados» significa que el conjunto de movimientos de `/api/metrics` se filtra primero y después se recalculan en el frontend los indicadores y gráficos actuales.

## Contrato de API

### Rango disponible

`GET /api/metrics/facets` no requiere parámetros. Su respuesta incluye `min_date` y `max_date`, como fechas ISO `YYYY-MM-DD`; estos campos determinan el rango de referencia de la interfaz.

### Movimientos filtrados

`GET /api/metrics` acepta los siguientes parámetros opcionales:

| Parámetro | Formato | Comportamiento |
| --- | --- | --- |
| `start_date` | `YYYY-MM-DD` | Incluye movimientos cuya `create_date` sea igual o posterior a la fecha indicada. |
| `end_date` | `YYYY-MM-DD` | Incluye movimientos cuya `create_date` sea igual o anterior a la fecha indicada. |

Enviar únicamente los parámetros cuyo input tenga valor; no enviar parámetros de fecha vacíos. La respuesta es un arreglo de movimientos con `create_date`, `amount`, `operation_type`, `category` y `business_type`. Los datos derivados de esta respuesta deben actualizarse juntos para que el dashboard represente un mismo intervalo.

## Criterios de aceptación

1. Al cargar el dashboard, se consultan las facetas y se muestra el rango mínimo y máximo disponible.
2. Con ambos inputs vacíos, se solicita `GET /api/metrics` sin `start_date` ni `end_date`.
3. Con una o ambas fechas seleccionadas, se envían los valores correspondientes como `YYYY-MM-DD` en la query string.
4. Los movimientos en los límites seleccionados se incluyen; los que quedan fuera se excluyen.
5. Los KPIs, el gráfico de ingresos/gastos y el gráfico de margen se actualizan de acuerdo con los movimientos filtrados.
6. Limpiar el filtro restaura ambos inputs vacíos y muestra nuevamente todos los movimientos disponibles.
7. La interfaz no permite seleccionar fechas fuera del rango publicado ni un intervalo invertido.

## Fuera de alcance

- Añadir filtros por categoría, operación o segmento de negocio a la interfaz.
- Cambiar el endpoint, el contrato de movimientos o las fórmulas financieras.
- Usar `GET /api/metrics/summary`: el dashboard actual calcula sus visualizaciones desde los movimientos de `/api/metrics`.