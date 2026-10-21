# Fechas y datos simulados

## Nombre
Preservar fechas de calendario y controlar los datos de prueba.

## Alcance
Generacion en `backend/app/routes.py`, agrupacion en `frontend/src/lib/financial-utils.ts` y pruebas temporales.

## Justificacion
- [routes.py](../../backend/app/routes.py) genera 30 movimientos por mes, usa `date.today()` y modifica el RNG global con `random.seed`; la semilla no congela las fechas.
- [financial-utils.ts](../../frontend/src/lib/financial-utils.ts) usa getters UTC y formato UTC para conservar el mes de una fecha ISO sin hora. Antes usaba getters locales; una regresion real demostro el desplazamiento de febrero a enero en `America/Bogota`.
- [App.tsx](../../frontend/src/App.tsx) obtiene el periodo visible desde las series mensuales en vez de fijar un ejercicio.

## Guia
- Tratar `create_date` como fecha de calendario; no desplazar el mes segun la zona horaria del usuario.
- Al tocar el parseo o agrupacion, conservar la interpretacion UTC actual o justificar otra representacion de calendario equivalente. Cubrir inicio de mes y cambio de ano; no mezclar getters UTC con formato local dependiente de zona.
- Controlar el reloj o derivar intervalos del conjunto de datos en pruebas; no asumir que una semilla hace estable el ano.
- Si se modifica el generador, preferir una instancia local de RNG en lugar de ampliar el uso de estado aleatorio global.
- Mantener el orden cronologico y la clave ano-mes; no mezclar meses de anos distintos ni volver a fijar 2024 en la cabecera.
- No presentar movimientos simulados como datos persistidos o financieros reales.

## Verificacion
Ejecutar `docker compose exec -T -e TZ=America/Bogota frontend npm test -- src/lib/financial-utils.test.ts` y repetir con `-e TZ=UTC`. Las pruebas deben incluir dia 1, cambio de ano y movimientos desordenados; ejecutar solo en UTC no detecta la regresion original.

## Validacion practica
Se observaron dos fallos antes del arreglo y seis tests correctos por zona despues. El generador backend y su RNG global no se modificaron. Detalle en [verification.md](../../verification.md#validacion-practica-de-reglas).