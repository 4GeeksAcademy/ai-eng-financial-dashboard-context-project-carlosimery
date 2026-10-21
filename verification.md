# Verificacion del proyecto

Fecha: 2026-10-21. Leyenda: ✅ confirmado; ❌ afirmacion incorrecta; ❓ pendiente o no comprobado.

## Resumen contrastado con el codigo

- ✅ Dashboard financiero de demostracion: ingresos, gastos, beneficio y margen (beneficio / ingresos), con graficos mensuales. React 19, TypeScript, Vite 8, Tailwind y Recharts.
- ✅ FastAPI genera 360 movimientos simulados (30 por mes), ordenados por fecha, con semilla 42. Los importes son reproducibles; las fechas dependen del dia de ejecucion. No hay persistencia ni base de datos configurada.
- ✅ La pantalla carga GET `/api/metrics` y calcula KPIs y agregaciones mensuales en el navegador; no consume los endpoints avanzados.
- ❌ La afirmacion de que los datos representan el ejercicio 2024 era incorrecta: `routes.py` genera datos para los doce meses completos anteriores al mes actual.
- ✅ Desajuste corregido en `App.tsx`: la cabecera toma el primer y ultimo mes de las series calculadas, en vez de mostrar `2024 - Full Year`. Durante carga muestra `Loading...`; sin datos muestra `No data`. El valor por defecto del componente tambien deja de afirmar 2024.
- ❌ Filtros, comparaciones y alertas no son controles de la pantalla actual: existen en la API. Las alertas usan un umbral sobre la media historica de gastos, no un modelo de IA.

## Estructura y entry points

| Superficie | Archivos y responsabilidad |
| --- | --- |
| Orquestacion | `docker-compose.yml`: servicios frontend y backend, montajes del codigo y puertos publicados |
| Frontend | `frontend/index.html` -> `src/main.tsx` -> `src/App.tsx`; componentes en `src/components/dashboard` y `src/components/ui` |
| Calculos | `frontend/src/lib/financial-utils.ts`: KPIs, series mensuales y formato USD; `financial-types.ts`: contrato TypeScript |
| Backend | `backend/Dockerfile` -> debugpy -> Uvicorn `app.main:app` -> router de `app/routes.py`; modelos Pydantic, generador y consultas |
| Pruebas | `backend/tests/test_routes.py` (pytest); `frontend/src/lib/financial-utils.test.ts` (Vitest) |
| Documentacion | `README.md`, `README.es.md`, `AGENTS.md`; no existen `.agents/rules`, `.agents/skills` ni `memory-bank` en esta revision |

## Conexion y ejecucion

1. Desde la raiz: `docker compose up --build -d`. Requiere Docker y Compose disponibles.
2. Frontend: imagen Node 24 Alpine, `npm run dev -- --host 0.0.0.0 --port 5173`.
3. Backend: imagen Python 3.13 slim, Uvicorn con recarga en `0.0.0.0:8000`; debugpy en `0.0.0.0:5678` (no es HTTP).
4. El navegador pide `/api/metrics` al origen del frontend. Vite lo reenvia a `http://host.docker.internal:8000`; Compose define ese nombre con `host-gateway`, usando el puerto publicado del backend. Se conserva el ajuste previo del workspace; no es una conexion directa por DNS `backend`.
5. `VITE_API_BASE_URL` permite saltarse el proxy y llamar a otro origen desde el navegador. No incluir `/api` en ese valor: App agrega `/api/metrics`.
6. Confirmar puertos con `docker compose ps` y `docker compose port frontend 5173` / `docker compose port backend 8000`. En Codespaces, obtener enlaces reales con `gh codespace ports --codespace "$CODESPACE_NAME"`; no confundir `0.0.0.0` con una URL navegable ni asumir que localhost del usuario es el host Docker.
7. Logs: `docker compose logs --tail=50 frontend backend`. Parar: `docker compose down` (sin `-v`).

Los puertos configurados son frontend 5173, API 8000 y depurador 5678. `depends_on` ordena el arranque, pero no espera que la API este lista. Estos son servidores de desarrollo, no un despliegue de produccion. Ejecutar Vite fuera de Docker requiere adaptar su destino de proxy o usar un origen API accesible; el alias host-gateway lo aporta Compose.

## Rutas clave

Todos los endpoints de datos son GET, definidos en `backend/app/routes.py`.

| Ruta | Funcion |
| --- | --- |
| `/health` | Estado de la API; no pasa por el proxy `/api` |
| `/api/metrics` | Movimientos; filtros por fechas, categoria y operacion |
| `/api/metrics/b2b`, `/api/metrics/b2c` | Movimientos segmentados y mismos filtros |
| `/api/metrics/facets` | Opciones de filtro y rango de fechas |
| `/api/metrics/summary` | Ingresos, gastos y neto por dia, semana o mes; admite segmento B2B/B2C |
| `/api/metrics/categories/top` | Ranking por importe, operacion y limite |
| `/api/metrics/comparison` | Neto de un intervalo frente al anterior de igual duracion; exige start_date y end_date |
| `/api/metrics/alerts` | Incrementos de gastos sobre la media previa; umbral por defecto 0.3 |
| `/docs`, `/openapi.json` | Documentacion y contrato generados por FastAPI |

## Resultados de ejecucion

- ✅ `docker compose up --build -d` construyo imagenes, pero encontro una referencia obsoleta del runtime (`container with given ID already exists`). `docker compose up -d --force-recreate` recupero el arranque; ambos servicios quedaron `Up`, sin borrar volumenes.
- ✅ `docker compose ps` y `docker compose port`: frontend `0.0.0.0:5173`, API `0.0.0.0:8000`, debugpy publicado en 5678. Son interfaces de escucha, no enlaces de navegador.
- ✅ `gh codespace ports --codespace "$CODESPACE_NAME"` confirma reenvios privados para 5173, 8000 y 5678 en `obscure-guide-x797jp7wrrrcpq5v` (dominio `app.github.dev`). Frontend: https://obscure-guide-x797jp7wrrrcpq5v-5173.app.github.dev/ ; docs: https://obscure-guide-x797jp7wrrrcpq5v-8000.app.github.dev/docs . Acceso autenticado externo no comprobado.
- ✅ Smoke HTTP ejecutado con Node dentro del frontend, `fetch` y `node:assert/strict`: `/health`, `/api/metrics`, `/api/metrics/b2b`, `/api/metrics/b2c`, `/api/metrics/facets`, `/api/metrics/summary?group_by=month`, `/api/metrics/categories/top?limit=3`, `/api/metrics/comparison` con fechas observadas y `/api/metrics/alerts` devolvieron 200 a traves del backend publicado en `http://host.docker.internal:8000`.
- ✅ La misma prueba comprobo 360 movimientos ordenados, fechas observadas `2025-10-02` a `2026-09-28`, segmentacion B2B/B2C, filtros combinados `category=sales&operation_type=income`, 12 resumenes mensuales con neto consistente y ranking descendente de tres categorias.
- ✅ `/api/metrics` por Vite (`http://127.0.0.1:5173` desde su propio contenedor) devolvio 200 y JSON identico al backend. `/` devolvio HTML con el entry point `/src/main.tsx`. No se presupuso que localhost del navegador del usuario fuera ese contenedor.
- ✅ `/docs` devolvio HTML de Swagger, `/openapi.json` devolvio 200 con 9 rutas declaradas y `group_by=invalid` devolvio 422. El proxy solo cubre `/api`, no `/health` ni `/docs`.
- ✅ `docker compose exec -T backend pytest -q`: 15 passed, 1 warning de deprecacion Starlette/httpx.
- ✅ `docker compose exec -T frontend npm test`: 5 passed. `docker compose exec -T frontend npm run build`: TypeScript y bundle correctos.
- ✅ Tras corregir la cabecera se repitieron los mismos tests (5 passed) y la compilacion; el chunk JS final mide 584.31 kB y mantiene la advertencia de tamano (>500 kB). Los tests cubren calculos y orden mensual, no el renderizado del componente.
- ❓ No se ha comprobado el renderizado ni la interaccion en un navegador.

## Correccion del acceso por Codespaces

- ❌ La prueba inicial de `/` sin cabecera Host externa no detectaba el bloqueo de Vite: con el hostname real de Codespaces devolvia 403 (`Blocked request. This host is not allowed`). Que el puerto estuviera reenviado no garantizaba acceso a la aplicacion.
- ✅ Compose ahora transmite `CODESPACE_NAME` y `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN` al frontend; Vite permite exactamente el hostname del frontend de ese Codespace mediante `server.allowedHosts`. Fuera de Codespaces la lista queda vacia; no se desactiva la validacion de hosts.
- ✅ Despues de `docker compose up -d --no-deps frontend`, las peticiones a `/` y `/api/metrics` con `Host: obscure-guide-x797jp7wrrrcpq5v-5173.app.github.dev` devolvieron 200. Con `Host: untrusted.example`, `/` devolvio 403.
- ✅ Se repitio `docker compose exec -T frontend npm run build`: correcto, manteniendo la advertencia de tamano ya registrada. Sigue pendiente la comprobacion visual y del acceso autenticado externo; el puerto continua privado.

## Validacion practica de reglas

Fecha: 2026-10-21. Se ejercito cada archivo con una tarea real; no equivale a certificar todas sus recomendaciones ni a resolver cada riesgo del proyecto. No se crearon commits ni se hizo stage; tampoco se cambio la visibilidad de puertos.

| Regla | Tarea realizada | Resultado observado y refinamiento |
| --- | --- | --- |
| [01 Arquitectura](agents/rules/01-arquitectura-contratos.md) | Agregar prueba de serializacion JSON a la ruta existente `/api/metrics` con fixture controlada | Campos y valores explicitos correctos; se precisaron comandos de contrato/calculos/build. No se cambio el contrato publico. |
| [02 Naming](agents/rules/02-naming-componentes.md) | Ajustar agrupacion en la utilidad existente conservando exports, nombres y tipos | Build y lint correctos; se aclara que ESLint no valida compatibilidad JSON. No hubo cambio visual. |
| [03 Fechas](agents/rules/03-fechas-datos.md) | Agregar regresiones de dia 1 y cambio de ano; corregir getters y formato a UTC | Antes: 2 fallos en Bogota. Despues: 6 tests correctos en Bogota y 6 en UTC. La regla ya describe la solucion actual, no el defecto como vigente. |
| [04 Testing](agents/rules/04-testing.md) | Sustituir assertions debiles de comparacion y resumen semanal con balances exactos y un segmento distractor | 16 tests backend correctos; fixture parchea el generador en su lugar de uso y evita depender de `date.today()`. |
| [05 DX](agents/rules/05-dx-conectividad.md) | Comprobar API, proxy, HTML, hostname y enlaces efectivos | Salud 200, 360 movimientos iguales por API/proxy, Host real 200; externo sin login 302 a GitHub. Se precisan capas y comandos; no se probo arranque en frio en esta ronda. |
| [06 Seguridad](agents/rules/06-seguridad-dependencias.md) | Intentar acceso con hostname ajeno sin cambiar configuracion | Curl: Host ajeno 403 y legitimo 200. El primer intento con fetch dio 200 al ajeno, por lo que se descarto como evidencia del Host enviado; la regla ahora pide curl explicito. No se valido instalacion limpia ni produccion. |
| [07 Documentacion](agents/rules/07-documentacion.md) | Corregir estructura y pasos de ejecucion en ambos READMEs | Compose valido y pasos criticos presentes en ambos idiomas; se distingue equivalencia de instrucciones de una traduccion literal o un nuevo arranque. |
| [08 Agents](agents/rules/08-agents.md) | Crear y ejecutar verificador de reglas; revisar higiene sin hacer commit | 8 reglas, cero errores de estructura/enlaces. Se precisan comandos y limites: no valida veracidad semantica ni autoriza stage/commit. |

Comandos ejecutados en esta ronda:

```bash
docker compose exec -T -e TZ=America/Bogota frontend npm test -- src/lib/financial-utils.test.ts
docker compose exec -T -e TZ=UTC frontend npm test -- src/lib/financial-utils.test.ts
docker compose exec -T backend pytest -q tests/test_routes.py
docker compose exec -T frontend npm run build
docker compose exec -T frontend npm run lint
docker compose config --quiet
bash -n agents/check-rules.sh
bash agents/check-rules.sh
git diff --check
git diff --cached --check
git status --short
```

HTTP: se uso Node dentro del frontend para salud, HTML y comparacion de JSON por `http://host.docker.internal:8000` y `http://127.0.0.1:5173`; para Host se repitio con curl explicito desde el entorno y puertos observados. `gh codespace ports --codespace "$CODESPACE_NAME" --json browseUrl,sourcePort,visibility` confirmo reenvios privados 5173/8000/5678; curl externo sin credenciales dio 302, no una prueba de acceso autenticado. La ultima compilacion produjo un chunk de 584.34 kB con warning de tamano; pytest mantiene un warning de deprecacion Starlette/httpx. Renderizado visual, login externo, arranque en frio e instalacion limpia siguen sin verificarse en esta ronda.

## Notas de PR

- Alcance: mapa del sistema, resumen corregido y cabecera alineada con los datos; registrar evidencia sin presentar capacidades de la API como controles existentes de la UI.
- Se preservan los cambios previos en `docker-compose.yml` y `frontend/vite.config.ts`.
- Mensaje de commit propuesto: `fix: align dashboard period with data and document verified architecture`.
- No se crea commit ni PR automaticamente.