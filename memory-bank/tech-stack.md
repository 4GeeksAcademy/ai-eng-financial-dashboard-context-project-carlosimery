# Stack tecnologico

Revision documental: 2026-10-21. Las versiones siguientes son declaraciones de manifests o imagenes; no versiones instaladas comprobadas en esta tarea.

## Lenguajes y frontend

| Elemento | Hecho y evidencia |
| --- | --- |
| TypeScript y TSX | [tsconfig.app.json](../frontend/tsconfig.app.json) configura target ES2023, JSX React y alias `@/*` a `src/*`. |
| React y React DOM | Rangos `^19.2.4` en [package.json](../frontend/package.json); montaje con StrictMode en [main.tsx](../frontend/src/main.tsx). |
| Vite y TypeScript | Vite `^8.0.4`, TypeScript `~6.0.2`, plugin React y scripts de desarrollo/build en [package.json](../frontend/package.json). |
| Estilos | Tailwind CSS y plugin Vite `^4.2.2`; estilos en [index.css](../frontend/src/index.css). |
| Graficos e iconos | Recharts `^3.8.1` y lucide-react `^1.8.0` en [package.json](../frontend/package.json). |
| Primitivas y clases | Componentes locales en [card.tsx](../frontend/src/components/ui/card.tsx); `cn` combina clsx y tailwind-merge en [utils.ts](../frontend/src/lib/utils.ts). Tambien se declara class-variance-authority; declaracion no implica uso en cada componente. |
| Validacion | Vitest `^4.1.4`, ESLint 9 y typescript-eslint en [package.json](../frontend/package.json). Las pruebas actuales de calculos estan en [financial-utils.test.ts](../frontend/src/lib/financial-utils.test.ts). |

## Backend

- Python: imagen `python:3.13-slim` en [Dockerfile](../backend/Dockerfile).
- FastAPI, Uvicorn con extras standard, debugpy, pytest, pytest-cov y httpx: [requirements.txt](../backend/requirements.txt), sin versiones fijadas. Pydantic se importa en [routes.py](../backend/app/routes.py), pero no tiene una version declarada directamente en requirements.
- Modelos Pydantic y anotaciones Literal para validar contratos y parametros; agregaciones en Python con biblioteca estandar. Evidencia: [routes.py](../backend/app/routes.py).
- TestClient y fixtures pytest en [test_routes.py](../backend/tests/test_routes.py); no servicio de base de datos declarado en [Compose](../docker-compose.yml).

## Infraestructura y configuracion

- Docker Compose define solo `frontend` y `backend`, con codigo montado y un volumen anonimo de `node_modules`. Evidencia: [docker-compose.yml](../docker-compose.yml).
- Frontend: imagen `node:24-alpine`; instala con `npm install` y ejecuta Vite en `0.0.0.0:5173`. Existe [package-lock.json](../frontend/package-lock.json), pero el [Dockerfile](../frontend/Dockerfile) no usa `npm ci`.
- Backend: debugpy escucha en `0.0.0.0:5678`; Uvicorn sirve `app.main:app` en `0.0.0.0:8000` con `--reload`. Evidencia: [Dockerfile](../backend/Dockerfile).
- Puertos configurados: 5173, 8000 y 5678. Son configuracion del repo, no garantia de disponibilidad o URLs actuales. Consultar mapeos efectivos con Compose y enlaces con GitHub CLI.
- `VITE_API_BASE_URL` permite otro origen accesible desde el navegador; copiar [frontend/.env.example](../frontend/.env.example) a `frontend/.env`, sin agregar `/api` a la base. Reiniciar Vite al cambiarla. El proxy/alias por defecto depende de Compose.
- `CODESPACE_NAME` y `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN` llegan por Compose. Vite permite el hostname concreto del frontend de ese Codespace, no todos los hosts. Evidencia: [vite.config.ts](../frontend/vite.config.ts).
- Bash y Git se usan para validacion de reglas e higiene; el comando de comprobacion local es `bash agents/check-rules.sh`. Evidencia: [check-rules.sh](../agents/check-rules.sh).

## Comandos existentes

Desde la raiz, con Docker y Compose disponibles:

```bash
docker compose up --build -d
docker compose ps
docker compose port frontend 5173
docker compose port backend 8000
docker compose exec -T backend pytest -q tests/test_routes.py
docker compose exec -T frontend npm test
docker compose exec -T frontend npm run build
docker compose exec -T frontend npm run lint
bash agents/check-rules.sh
```

En Codespaces: `gh codespace ports --codespace "$CODESPACE_NAME" --json browseUrl,sourcePort,visibility`. No usar URLs de sesiones antiguas como configuracion. El puerto 5678 no es HTTP. Para logs: `docker compose logs --tail=50 frontend backend`; para detener, `docker compose down` sin borrar volumenes con `-v`.

Fuentes de instrucciones de arranque: [README](../README.md) y [README en espanol](../README.es.md). Este stack es de desarrollo; build de frontend no constituye un despliegue de produccion.