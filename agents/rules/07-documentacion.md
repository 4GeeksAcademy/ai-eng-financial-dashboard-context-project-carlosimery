# Documentacion

## Nombre
Mantener instrucciones bilingues y evidencia con alcance explicito.

## Alcance
`README.md`, `README.es.md`, `verification.md` y notas de entrega.

## Justificacion
- [README.md](../../README.md) y [README.es.md](../../README.es.md) describen el mismo arranque con Compose y la variable de API.
- [verification.md](../../verification.md) contiene comandos, resultados, advertencias, URLs privadas y comprobaciones pendientes de una sesion fechada.

## Guia
- Actualizar ambos READMEs cuando cambien arranque, requisitos, variables o puntos de acceso documentados.
- Separar arquitectura confirmada, resultado de una ejecucion e hipotesis; no convertir un workaround de entorno en requisito universal sin comprobarlo.
- Registrar fecha, comando, resultado y limites de verificacion cuando se actualice el rastro. No marcar como comprobada una interaccion visual no realizada.
- Tratar las URLs privadas y estados de contenedores registrados como evidencia historica; consultar el entorno actual antes de reutilizarlos.
- No atribuir controles a la pantalla solo porque haya endpoints correspondientes en la API.
- Proponer mensajes de commit o notas de PR sin afirmar que se creo un commit o PR si no se ejecuto esa accion autorizada.

## Verificacion
Tras cambiar instrucciones de arranque, ejecutar `docker compose config --quiet` y contrastar comandos con `docker-compose.yml` y `frontend/package.json`. Revisar en ambos READMEs las mismas rutas, variables y pasos (no exigir traduccion literal). Ejecutar `bash agents/check-rules.sh` para enlaces de reglas y `git diff --check` para higiene. Este script no valida todos los enlaces de los READMEs; revisar los que se agreguen.

## Validacion practica
Se corrigio en ambos READMEs la ruta de reglas, el archivo `frontend/.env`, arranque desacoplado y acceso privado de Codespaces. Se comprobaron Compose y presencia equivalente de los pasos, no un nuevo arranque completo. Evidencia en [verification.md](../../verification.md#validacion-practica-de-reglas).