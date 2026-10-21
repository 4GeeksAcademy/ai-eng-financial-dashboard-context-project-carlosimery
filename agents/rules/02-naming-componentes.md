# Naming y componentes

## Nombre
Conservar vocabulario del contrato y organizacion de la UI.

## Alcance
`frontend/src/components/`, `frontend/src/lib/` y campos JSON de la API.

## Justificacion
- [financial-types.ts](../../frontend/src/lib/financial-types.ts) usa `create_date`, `operation_type` y `business_type` para movimientos, pero `totalIncome` y `profitPercent` para KPIs.
- [kpi-row.tsx](../../frontend/src/components/dashboard/kpi-row.tsx) compone indicadores de dominio; [card.tsx](../../frontend/src/components/ui/card.tsx) es una primitiva visual.
- [utils.ts](../../frontend/src/lib/utils.ts) proporciona `cn`, que combina `clsx` y `tailwind-merge`.

## Guia
- Conservar `snake_case` en el contrato de movimientos y `camelCase` en valores derivados del frontend.
- No traducir ni renombrar unilateralmente los literales `income`, `outcome`, `B2B`, `B2C` o las categorias; coordinar cualquier cambio de contrato.
- Seguir los nombres de archivo `kebab-case` y de componentes `PascalCase` de los componentes existentes.
- Mantener primitivas reutilizables en `components/ui` y composicion financiera en `components/dashboard`.
- Reutilizar `cn` para combinar clases y el alias `@/` para imports desde la raiz de `src`, siguiendo los imports vecinos.
- Respetar el estilo del archivo tocado; no imponer una normalizacion global de comillas o punto y coma.

## Verificacion
Ejecutar `docker compose exec -T frontend npm run build` para tipos/imports y `docker compose exec -T frontend npm run lint` para reglas estaticas. Si se renombra un campo de movimiento, ejecutar tambien la prueba backend `test_metrics_serializes_movement_contract`; ESLint no demuestra que un contrato JSON siga siendo compatible.

## Validacion practica
El ajuste de fechas en [financial-utils.ts](../../frontend/src/lib/financial-utils.ts) conserva exports, tipos y nombres de propiedades; build y lint pasaron. No se cambio ni se comprobo visualmente un componente. Evidencia en [verification.md](../../verification.md#validacion-practica-de-reglas).