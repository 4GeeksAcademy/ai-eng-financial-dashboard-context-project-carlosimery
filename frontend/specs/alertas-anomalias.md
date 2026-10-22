# Alertas de anomalías del dashboard

## Objetivo

Mostrar, debajo de los gráficos del dashboard principal, los períodos en que el gasto supera el umbral configurado.

## Interfaz

- Mostrar una tabla con período, gasto registrado, promedio de referencia e incremento porcentual.
- El umbral es un ratio decimal entre `0.01` y `1.0`, con valor inicial `0.3`.
- Si el umbral es inválido mientras se edita, mostrar validación y no solicitar alertas con ese valor.
- Mostrar un estado vacío explícito cuando la API devuelva una lista vacía.
- Enviar a la API las fechas de inicio y fin activas en el dashboard, para que la alerta use el mismo conjunto de datos filtrado.

## Contrato de API

`GET /api/metrics/alerts` devuelve un arreglo de:

| Campo API | Significado presentado |
| --- | --- |
| `period` | Período de agregación (mensual en el dashboard). |
| `outcome_total` | Gasto registrado en el período. |
| `baseline_average` | Promedio de gastos de los períodos anteriores considerados por la API. |
| `increase_ratio` | Incremento relativo respecto a `baseline_average`; multiplicarlo por 100 para mostrar porcentaje. |

Parámetros usados por el dashboard: `threshold` (ratio), `group_by=month` y, cuando estén definidos, `start_date` y `end_date` en formato `YYYY-MM-DD`. La API también admite `business_type`, que no forma parte de esta funcionalidad.

## Desajuste entre requerimiento y API

El requerimiento pide la media móvil de los tres períodos anteriores. El contrato solo expone `baseline_average`, y el cálculo actual de la API promedia todos los períodos anteriores presentes en el conjunto filtrado; no limita el promedio a los tres inmediatamente anteriores. Por fidelidad al contrato, la interfaz denomina esta columna **Historical average** y muestra `baseline_average`; no debe describirse como media móvil de tres períodos. Cambiar esa semántica requiere un cambio posterior del contrato o del requerimiento, no se resuelve alterando esta integración.

El requerimiento restringe el umbral a `0.01–1.0`, mientras que OpenAPI declara únicamente un mínimo de `0`. La interfaz aplica el rango solicitado y valida antes de consultar; el límite superior no está impuesto por el servidor.

## Criterios de aceptación

1. El valor inicial del input es `0.3`; se permiten ratios entre `0.01` y `1.0`.
2. El dashboard consulta las alertas mensuales con el umbral actual y el rango de fechas seleccionado.
3. Cada fila muestra los campos devueltos por la API y el incremento como porcentaje.
4. Una respuesta vacía muestra un mensaje explícito dentro de la tabla.
5. Los errores de consulta se muestran como estado de error y no como estado vacío.