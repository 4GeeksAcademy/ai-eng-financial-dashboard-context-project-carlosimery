# DX y conectividad

## Nombre
Verificar el recorrido real de las peticiones y el arranque.

## Alcance
`docker-compose.yml`, Dockerfiles, `frontend/vite.config.ts`, variables de API y diagnostico de acceso.

## Justificacion
- [docker-compose.yml](../../docker-compose.yml) aporta `host-gateway`, variables de Codespaces y puertos publicados; solo declara frontend y backend.
- [vite.config.ts](../../frontend/vite.config.ts) reenvia `/api` a `host.docker.internal:8000` y construye un hostname permitido con el puerto 5173.
- [App.tsx](../../frontend/src/App.tsx) agrega `/api/metrics` a `VITE_API_BASE_URL` y no implementa reintentos; Compose tiene `depends_on` pero no healthcheck.
- [verification.md](../../verification.md) registra que un 200 interno no detecto el 403 con hostname externo.

## Guia
- Revisar conjuntamente puertos, destino del proxy, alias y hostname permitido cuando cambie la conectividad. No sustituir el gateway sin probar la alternativa en el entorno real.
- Mantener `VITE_API_BASE_URL` como origen/base sin duplicar `/api`; comprobar la URL final desde el navegador. El alias del host lo aporta Compose, no un Vite ejecutado directamente fuera de Docker.
- Probar un arranque en frio: `depends_on` no garantiza que FastAPI acepte peticiones. Si se cambia el arranque, definir espera o recuperacion de disponibilidad.
- Diagnosticar por capas: backend, frontend, `/api/metrics` por proxy, hostname reenviado y sesion de acceso externa.
- Obtener puertos efectivos con `docker compose ps` / `docker compose port` y enlaces de Codespaces con `gh codespace ports`; no inventar URLs ni confundir `0.0.0.0` con un enlace de navegador.
- No declarar resuelto el acceso externo con un curl interno; registrar por separado redirecciones de autenticacion y la prueba en navegador.
- Arrancar solo servicios soportados por el repo. No borrar volumenes ni recrear redes como primer paso sin evidencia de que corresponda.

## Verificacion
1. Ejecutar `docker compose config --quiet`, `docker compose ps` y `docker compose port frontend 5173` / `docker compose port backend 8000`.
2. Con los mapeos actuales confirmados, probar `curl --max-time 20 -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/health` y `/api/metrics` directo y por el puerto frontend observado. Comparar tambien el JSON, no solo el codigo HTTP.
3. En Codespaces, probar `/` con `curl -H "Host: ${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"` y obtener enlaces mediante `gh codespace ports --codespace "$CODESPACE_NAME" --json browseUrl,sourcePort,visibility`.
4. Registrar por separado el acceso externo autenticado. Un 302 al login no demuestra un fallo de Vite ni que el usuario pueda abrir la pagina. `/health` y `/docs` pertenecen al backend, no al proxy `/api`.

## Validacion practica
Se compararon 360 movimientos identicos por API y proxy, y se comprobo 200 con hostname real mediante curl. No se repitio arranque en frio ni login de navegador. Evidencia en [verification.md](../../verification.md#validacion-practica-de-reglas).