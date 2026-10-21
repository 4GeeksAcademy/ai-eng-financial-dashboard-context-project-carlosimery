# Seguridad y dependencias

## Nombre
No ampliar exposicion ni asumir builds reproducibles.

## Alcance
Configuracion de desarrollo, CORS, puertos, hosts permitidos, Dockerfiles y dependencias.

## Justificacion
- [main.py](../../backend/app/main.py) configura CORS con origenes amplios y credenciales; [docker-compose.yml](../../docker-compose.yml) publica debugpy en 5678.
- [vite.config.ts](../../frontend/vite.config.ts) permite el hostname concreto de Codespaces, sin desactivar la validacion de hosts.
- [frontend/Dockerfile](../../frontend/Dockerfile) usa `npm install` aunque existe [package-lock.json](../../frontend/package-lock.json); [requirements.txt](../../backend/requirements.txt) no fija versiones.

## Guia
- Tratar la configuracion actual como desarrollo; no presentarla como despliegue seguro de produccion.
- No hacer publicos puertos privados ni ampliar CORS o `allowedHosts` como arreglo automatico de conectividad. Pedir autorizacion antes de aumentar exposicion.
- Mantener el rechazo de hosts ajenos al modificar la lista permitida; no usar `allowedHosts: true` para eludir un 403.
- No confundir el puerto de depuracion con un endpoint HTTP ni exponerlo innecesariamente.
- Al cambiar dependencias frontend, actualizar el lockfile. Si se cambia la estrategia de instalacion, preferir `npm ci` cuando el lockfile este sincronizado.
- Al abordar reproducibilidad Python, proponer versiones o un mecanismo de bloqueo explicito; no afirmar que los requisitos actuales bloquean versiones.
- No modificar dependencias ni migrar herramientas como limpieza incidental de una tarea no relacionada.

## Verificacion
Para hosts, usar `curl -H 'Host: untrusted.example'` contra el puerto frontend observado y exigir 403; repetir con el hostname legitimo y exigir 200. No dar por comprobada una cabecera Host solo por pasarla a `fetch`: en el ejercicio produjo un resultado distinto al curl explicito. Para dependencias modificadas, comprobar instalacion y los tests/build afectados; no presentar build como prueba de una instalacion limpia.

## Validacion practica
Curl confirmo hostname legitimo 200, ajeno 403 y puertos privados sin cambios. Build paso con warning de chunk grande; no se cambiaron dependencias, CORS, visibilidad ni depurador. Evidencia en [verification.md](../../verification.md#validacion-practica-de-reglas).