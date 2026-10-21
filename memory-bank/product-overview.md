# Overview del producto

Revision documental: 2026-10-21. Hechos contrastados con los archivos enlazados; no implica una comprobacion actual de disponibilidad del servicio.

## Proposito y alcance real

Dashboard de demostracion de metricas financieras con una pantalla React y una API FastAPI. Los [READMEs](../README.md) lo presentan como proyecto educativo; [routes.py](../backend/app/routes.py) genera movimientos simulados, no consulta una fuente financiera externa.

La pantalla muestra ingresos totales, gastos, beneficio y margen, mas graficos mensuales de ingresos/gastos y porcentaje de beneficio. Evidencia: [App.tsx](../frontend/src/App.tsx), [KPIRow](../frontend/src/components/dashboard/kpi-row.tsx) y [financial-utils.ts](../frontend/src/lib/financial-utils.ts).

## Datos y comportamiento

- Cada movimiento contiene `create_date`, `amount`, `operation_type`, `category` y `business_type`. El contrato se mantiene por separado en [modelos Python](../backend/app/routes.py) y [tipos TypeScript](../frontend/src/lib/financial-types.ts).
- La API genera 360 movimientos, 30 por mes, para los doce meses completos anteriores al mes actual. Usa semilla 42 en las rutas; las fechas dependen de `date.today()`. No representa un ejercicio fijo de 2024 ni datos almacenados. Evidencia: `generate_mock_movements` y `_year_for_month` en [routes.py](../backend/app/routes.py).
- Beneficio = ingresos - gastos; margen = beneficio / ingresos * 100. Si no hay ingresos, el frontend devuelve margen cero. Moneda mostrada: USD con formato `en-US`, sin decimales. Evidencia: [financial-utils.ts](../frontend/src/lib/financial-utils.ts).
- La cabecera deriva el periodo de los datos; hay estados de carga, error y ausencia de datos. La carga no implementa reintentos. Evidencia: [App.tsx](../frontend/src/App.tsx).

## Recorrido de una peticion

1. [index.html](../frontend/index.html) carga [main.tsx](../frontend/src/main.tsx), que monta [App.tsx](../frontend/src/App.tsx).
2. App solicita `${VITE_API_BASE_URL}/api/metrics`; la base es vacia por defecto y los KPIs se calculan en el navegador.
3. En Compose, el [proxy de Vite](../frontend/vite.config.ts) reenvia `/api` a `http://host.docker.internal:8000`. [Compose](../docker-compose.yml) aporta el alias `host-gateway` y las variables para el hostname permitido de Codespaces.
4. Uvicorn carga [app.main:app](../backend/app/main.py), que registra el router de [routes.py](../backend/app/routes.py).

## API disponible, no equivalente a controles de UI

[routes.py](../backend/app/routes.py) implementa GET de movimientos, segmentos B2B/B2C, opciones de filtros, resumen por dia/semana/mes, ranking de categorias, comparacion de periodos y alertas de incremento de gastos. App solo consume `/api/metrics`; no hay controles frontend que consuman todos esos endpoints.

`/health` es del backend. FastAPI genera `/docs` y `/openapi.json`; no pasan por el proxy `/api`. Las alertas comparan gastos con su media historica: no son inferencia de IA.

## Claims que no deben introducirse

- No afirmar integracion bancaria, contabilidad legal, datos financieros reales, predicciones de IA o persistencia: no estan implementados en las [rutas actuales](../backend/app/routes.py) ni como servicios de [Compose](../docker-compose.yml).
- No prometer filtros visuales, roles, autenticacion de producto o despliegue de produccion basandose solo en endpoints o en el login de Codespaces. [App.tsx](../frontend/src/App.tsx) y [main.py](../backend/app/main.py) no implementan ese producto; la autenticacion del puerto es del entorno.
- No inventar usuarios objetivo, acuerdos de servicio, funcionalidades futuras ni fechas de entrega. Los pendientes tecnicos documentados no constituyen un roadmap aprobado.

## Lectura relacionada

- [Stack y ejecucion](tech-stack.md).
- [Estado, gaps y pendientes](current-state.md).
- [Rastro de comprobaciones](../verification.md) y [reglas del proyecto](../AGENTS.md).