# Auditoría de patrones frontend orientados a deployment

> **Fecha:** 2026-10-23
> **Skill aplicada:** `vercel-react-best-practices` (vercel-labs/agent-skills)
> **Código auditado:** Frontend Vite + React SPA (sin Next.js)

---

## Resumen de hallazgos

| Prioridad | Hallazgos | Regla Vercel |
|-----------|-----------|-------------|
| 🔴 CRÍTICO | 3 | `bundle-dynamic-imports`, `async-suspense-boundaries` |
| 🟡 ALTO | 3 | `js-early-exit`, `rendering-resource-hints`, `bundle-defer-third-party` |
| 🔵 MEDIO | 2 | `rerender-memo-with-default-value`, `js-cache-function-results` |
| ⚪ BAJO | 2 | Dockerfile, healthcheck |

---

## 🔴 CRÍTICO

### D-CRÍTICO-1: Recharts no se carga con `React.lazy` (dynamic import)

**Regla:** `bundle-dynamic-imports` — "Use dynamic imports for heavy components"

**Archivos:** `income-outcome-chart.tsx`, `profit-percent-chart.tsx`

**Problema:** Recharts pesa ~584 kB en el bundle. Se importa estáticamente al inicio. En un dashboard esto significa que el usuario descarga toda la librería de gráficos antes de ver cualquier contenido, incluso cuando los KPI numéricos podrían pintarse primero.

**Corrección:**

En `App.tsx`, cambiar los imports estáticos por `lazy`:

```tsx
import { lazy, Suspense } from 'react'

const IncomeOutcomeChart = lazy(() =>
  import('@/components/dashboard/income-outcome-chart').then(m => ({ default: m.IncomeOutcomeChart }))
)
const ProfitPercentChart = lazy(() =>
  import('@/components/dashboard/profit-percent-chart').then(m => ({ default: m.ProfitPercentChart }))
)
```

Y en el punto de uso, envolver con `Suspense`:

```tsx
<Suspense fallback={<div className="h-[280px] rounded-lg bg-muted/30 animate-pulse" />}>
  <IncomeOutcomeChart data={monthlyData} loading={loading} />
</Suspense>
```

**Impacto estimado:** El bundle inicial pasaría de ~584 kB a ~150 kB (solo React + lucide + Tailwind). Recharts se cargaría bajo demanda.

---

### D-CRÍTICO-2: Sin retry ni timeout en fetch contra la API

**Regla:** `async-suspense-boundaries` — "Use Suspense to stream content" (aplica indirectamente como patrón de tolerancia a fallos)

**Archivo:** `App.tsx`, función `fetchFinancialData`

**Problema:** `fetch()` se ejecuta una sola vez al montar. Si la API tarda más de lo esperado o hay un error transitorio (el backend no estaba listo por `depends_on` sin healthcheck), el usuario ve el mensaje de error permanente sin posibilidad de reintentar.

**Corrección:**

```tsx
async function fetchFinancialData(retries = 2): Promise<FinancialMovement[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${API_BASE_URL}/api/metrics`, {
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    } catch (err) {
      if (attempt === retries) throw err
      // esperar antes de reintentar (backoff exponencial)
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
  throw new Error('Unreachable')
}
```

---

### D-CRÍTICO-3: Sin preload de datos ni estrategia de caché cliente

**Regla:** `client-swr-dedup` — "Use SWR for automatic request deduplication" (el principio aplica aunque no se use SWR)

**Archivo:** `App.tsx`

**Problema:** Cada vez que el componente se monta (o el usuario recarga), se vuelve a pedir toda la data. No hay caché en cliente. Si el usuario navega fuera y vuelve, refetch completo.

**Corrección (sin librería externa):** Cache simple con un Map a nivel módulo:

```tsx
const cache = new Map<string, { data: FinancialMovement[]; ts: number }>()
const CACHE_TTL = 60_000 // 1 minuto

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const cached = cache.get('metrics')
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }
  const response = await fetch(`${API_BASE_URL}/api/metrics`)
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
  const data: FinancialMovement[] = await response.json()
  cache.set('metrics', { data, ts: Date.now() })
  return data
}
```

---

## 🟡 ALTO

### D-ALTO-1: Sin `preconnect` ni `dns-prefetch` para la API

**Regla:** `rendering-resource-hints` — "Use React DOM resource hints for preloading"

**Archivo:** `frontend/index.html` / `App.tsx`

**Problema:** Cuando `VITE_API_BASE_URL` apunta a un origen distinto, el navegador no resuelve DNS ni establece conexión TCP hasta que encuentra el fetch. No hay resource hints.

**Corrección** (en `index.html`):

```html
<link rel="dns-prefetch" href="//api.example.com">
<link rel="preconnect" href="//api.example.com">
```

O desde React:

```tsx
import { preconnect } from 'react-dom'
useEffect(() => { preconnect('https://api.example.com') }, [])
```

---

### D-ALTO-2: `formatCurrency` y `formatPercent` se recrean en cada render

**Regla:** `js-cache-function-results` — "Cache function results in module-level Map"

**Archivo:** `financial-utils.ts`

**Problema:** `formatCurrency` crea un nuevo `Intl.NumberFormat` cada vez que se llama. Con ~11 usos en el dashboard y renders frecuentes, el `Intl.NumberFormat` se instancia repetidamente.

**Corrección:**

```ts
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}
```

---

### D-ALTO-3: Estado inicial de `metrics` es `null` obligando a ternarios en cada hijo

**Regla:** `rerender-defer-reads` — "Don't subscribe to state only used in callbacks" (aplica inverso: subscribir a valores derivados)

**Archivo:** `kpi-row.tsx`

**Problema:** `KPIRow` pasa a `KPICard` valores como `metrics ? formatCurrency(metrics.totalIncome) : '—'` para cada KPI. Son 4 condicionales idénticos. Podría simplificarse con un valor derivado único.

**Corrección (bajo impacto pero mejora legibilidad):** Extraer un objeto de valores formateados:

```tsx
const display = metrics
  ? {
      totalIncome: formatCurrency(metrics.totalIncome),
      totalOutcome: formatCurrency(metrics.totalOutcome),
      profit: formatCurrency(metrics.profit),
      profitPercent: formatPercent(metrics.profitPercent),
    }
  : null
```

---

## 🔵 MEDIO

### D-MEDIO-1: `loading={loading}` se pasa a todos los hijos aunque sea el mismo valor

**Regla:** `rerender-memo-with-default-value` (principio de pasar valores estables)

**Archivos:** `kpi-row.tsx`, `income-outcome-chart.tsx`, `profit-percent-chart.tsx`

**Problema:** `loading` es un booleano que se recibe de `useState` en App y se pasa a 4 componentes. Si App re-renderiza por cualquier causa (ej. cambio de estado interno futuro), los hijos recibirían el mismo booleano pero igual se re-renderizarían.

**Impacto real:** Bajo mientras no haya cambios de estado adicionales.

---

### D-MEDIO-2: `Suspense` no se usa en ningún lado

**Regla:** `async-suspense-boundaries` + `rendering-usetransition-loading`

**Archivo:** `App.tsx`

**Problema:** El loading state se maneja manualmente con un flag booleano. No hay boundaries de Suspense. Con React 19 y la carga diferida de gráficos (D-CRÍTICO-1), se beneficiaría de tenerlos.

---

## ⚪ BAJO

### D-BAJO-1: Dockerfile usa `npm install` en vez de `npm ci` para producción

**Archivo:** `frontend/Dockerfile`

**Problema:** `npm install` no garantiza reproducibilidad porque ignora el lockfile y resuelve versiones frescas. Para builds de CI/deployment debería usarse `npm ci`.

**Corrección:**

```dockerfile
COPY package*.json ./
RUN npm ci --omit=dev
```

---

### D-BAJO-2: Sin healthcheck ni ready check en Compose

**Archivo:** `docker-compose.yml`

**Problema:** El frontend arranca sin esperar a que la API esté lista. `depends_on` solo espera que el contenedor esté en ejecución, no que el proceso HTTP acepte conexiones.

**Corrección (agregar al servicio frontend):**

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:5173"]
  interval: 10s
  timeout: 5s
  retries: 5
```

---

## ✅ Lo que ya está bien (deployment-ready)

| Aspecto | Estado |
|---------|--------|
| TypeScript estricto (`strict: true` en tsconfig) | ✅ |
| Build con `tsc -b && vite build` verificando tipos | ✅ |
| Sin barrel files (imports directos) | ✅ |
| `type` en imports (`import type { X }`) | ✅ |
| `@/` alias configurado correctamente | ✅ |
| Sin componentes inline (todos a nivel módulo) | ✅ |
| Sin fugas de rendimiento: `React.memo` en `CustomTooltip` | ✅ |
| `computeKPIs` ya optimizado (single pass) | ✅ |
| Contraste de color OKLCH supera 4.5:1 ambos modos | ✅ |
| Estados vacío / loading / error cubiertos | ✅ |
| Variables de entorno con valor por defecto (`?? ""`) | ✅ |
| ESLint con reglas React y Hooks activas | ✅ |

---

## Acciones recomendadas (orden para deployment)

1. **🔴 D-CRÍTICO-1** — `React.lazy()` en los charts + Suspense (reduce bundle inicial ~70%)
2. **🔴 D-CRÍTICO-2** — Retry con backoff exponencial en fetch
3. **🔴 D-CRÍTICO-3** — Caché simple en cliente (Map con TTL)
4. **🟡 D-ALTO-1** — `preconnect` / `dns-prefetch` para API externa
5. **🟡 D-ALTO-2** — Hoistear `Intl.NumberFormat` a nivel módulo
6. **🟡 D-ALTO-3** — Extraer valores formateados en `KPIRow`
7. **🔵 D-MEDIO-1/2** — Evaluar si aportan valor en próximos sprints
8. **⚪ D-BAJO-1** — Cambiar `npm install` a `npm ci` en Dockerfile
9. **⚪ D-BAJO-2** — Agregar healthcheck a Compose