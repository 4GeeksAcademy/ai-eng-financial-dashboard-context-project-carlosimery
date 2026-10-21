# Testing

## Nombre
Comprobar comportamiento observable con pruebas del alcance correcto.

## Alcance
`backend/tests/`, `frontend/src/lib/*.test.ts` y validaciones de cambios funcionales.

## Justificacion
- [test_routes.py](../../backend/tests/test_routes.py) usa pytest y TestClient. La fixture `fixed_movements` reemplaza el generador con monkeypatch para comprobar serializacion, segmentacion y balances; corrige pruebas que antes solo verificaban campos o una lista no vacia.
- [financial-utils.test.ts](../../frontend/src/lib/financial-utils.test.ts) prueba calculos y orden mensual, no renderizado de React.
- [package.json](../../frontend/package.json) separa `test`, `build` y `lint`.

## Guia
- Ampliar los tests existentes de la superficie afectada antes de crear suites o utilidades paralelas.
- Para filtros, comprobar que todos los registros cumplen el criterio y que hay datos cuando el escenario lo requiere.
- Para agregaciones y comparaciones, comprobar importes, netos y diferencias esperados, no solo HTTP 200 o claves JSON.
- Para escenarios de rutas independientes del reloj, seguir `fixed_movements` y parchear `app.routes.generate_mock_movements`, que es donde las rutas lo consultan; no cambiar el generador de produccion para hacer pasar el test.
- Evitar tests que pasan con intervalos vacios accidentales o una lista de alertas siempre vacia; usar escenarios controlados para los casos positivos.
- Seleccionar checks segun el cambio: tests de API para backend, Vitest para calculos, build para contrato y compilacion, lint para reglas estaticas.
- No describir tests unitarios o build como prueba de renderizado, navegacion o acceso externo.

## Verificacion
Con Compose activo: `docker compose exec -T backend pytest -q tests/test_routes.py`; para frontend, `docker compose exec -T frontend npm test`, `docker compose exec -T frontend npm run build` o `docker compose exec -T frontend npm run lint`, segun corresponda. Tras una regresion fallida, repetir el mismo comando antes de ampliar alcance. Registrar fallos y warnings por separado.

## Validacion practica
Se reforzaron los tests semanal y de comparacion con importes esperados y un B2B distractor de 900; la suite backend paso 16 tests. No se certifica con ello que todos los endpoints tengan cobertura exhaustiva. Evidencia en [verification.md](../../verification.md#validacion-practica-de-reglas).