# Arquitectura y contratos

## Nombre
Mantener contratos y calculos financieros coherentes.

## Alcance
`backend/app/`, `frontend/src/App.tsx` y `frontend/src/lib/financial-*`.

## Justificacion
- [routes.py](../../backend/app/routes.py) define modelos Pydantic; [financial-types.ts](../../frontend/src/lib/financial-types.ts) declara los mismos movimientos por separado.
- [App.tsx](../../frontend/src/App.tsx) consume `response.json()` sin validacion en runtime y delega calculos en [financial-utils.ts](../../frontend/src/lib/financial-utils.ts).
- La API tambien calcula agregaciones. La pantalla actual solo consume `/api/metrics`.

## Guia
- Actualizar modelos Python, tipos TypeScript y consumidores cuando cambien campos o valores permitidos; no confiar en que TypeScript valide una respuesta HTTP.
- Mantener formulas financieras en funciones de dominio, no dentro de componentes visuales.
- Conservar beneficio = ingresos - gastos y margen = beneficio / ingresos * 100; con ingresos cero, la utilidad frontend devuelve margen cero.
- Al modificar formulas compartidas, contrastar agregados frontend y backend sobre los mismos movimientos.
- No afirmar que una funcion de la API ya esta integrada en la pantalla sin comprobar su consumidor.

## Verificacion
Con Compose activo, ejecutar `docker compose exec -T backend pytest -q tests/test_routes.py -k 'serializes_movement_contract or comparison or summary'` y `docker compose exec -T frontend npm test -- src/lib/financial-utils.test.ts`. Si cambia un contrato o consumidor TypeScript, ejecutar tambien `docker compose exec -T frontend npm run build`.

## Validacion practica
Se agrego una prueba de serializacion con claves JSON explicitas y datos controlados en [test_routes.py](../../backend/tests/test_routes.py), sin modificar rutas publicas. Resultado y limites en [verification.md](../../verification.md#validacion-practica-de-reglas).