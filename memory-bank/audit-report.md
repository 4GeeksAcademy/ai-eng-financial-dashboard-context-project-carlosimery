# Auditoría del Dashboard — Reporte de hallazgos y correcciones

> **Fecha:** 2026-10-23
> **Skills aplicadas:** `accessibility` (addyosmani/web-quality-skills) y `vercel-react-best-practices` (vercel-labs/agent-skills)
> **Base:** Código fuente estático (sin navegador en vivo)

---

## Resumen

| Categoría | Encontrados | Críticos | Altos | Medios | Bajos |
|-----------|------------|----------|-------|--------|-------|
| Accesibilidad (WCAG 2.2) | 8 | 2 | 2 | 2 | 2 |
| Performance React / Bundle | 4 | 1 | 1 | 2 | 0 |

---

## 🔴 Accesibilidad — Hallazgos

### A-CRÍTICO-1: Falta `role="alert"` en el mensaje de error

**Archivo:** `App.tsx` línea ~56  
**WCAG:** 3.3.1 (Error Identification), 4.1.3 (Status Messages)  
**Problema:** Cuando la API falla, se renderiza un `<div>` con texto de error pero sin `role="alert"`. Los lectores de pantalla no anuncian el error automáticamente.  
**Corrección:**

```tsx
{error ? (
  <div
    role="alert"
    className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground"
  >
    {error}
  </div>
) : null}
```

---

### A-CRÍTICO-2: Las gráficas Recharts no tienen etiqueta accesible ni role="img"

**Archivo:** `income-outcome-chart.tsx`, `profit-percent-chart.tsx`  
**WCAG:** 1.1.1 (Non-text Content), 4.1.2 (Name, Role, Value)  
**Problema:** El SVG generado por Recharts no tiene un `title` descriptivo ni `role="img"`. Un lector de pantalla encuentra un SVG sin nombre.  
**Corrección** (en ambos componentes, envolver `ResponsiveContainer` con un elemento semántico):

```tsx
<figure aria-label="Income vs. Outcome chart showing monthly revenue and expenditure">
  <ResponsiveContainer width="100%" height={280}>
    <LineChart
      data={data}
      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
      role="img"
      aria-label="Line chart: monthly income in blue, outcome in orange"
    >
      …
    </LineChart>
  </ResponsiveContainer>
</figure>
```

O bien agregar un `title` como primer hijo del SVG (Recharts lo permite mediante un componente personalizado).

---

### A-ALTO-1: Sin estilos `:focus-visible` globales

**Archivo:** `index.css`  
**WCAG:** 2.4.7 (Focus Visible), 2.4.11 (Focus Not Obscured) — nuevo WCAG 2.2  
**Problema:** El `@layer base` incluye `outline-ring/50` pero no hay un `:focus-visible` explícito. El outline predeterminado del navegador puede eliminarse con Tailwind y dejar elementos sin indicador de foco visible.  
**Corrección** (agregar al final de `index.css`):

```css
@layer base {
  /* ...existing... */

  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    scroll-margin-top: 80px;
  }
}
```

---

### A-ALTO-2: Sin skip link para navegación por teclado

**Archivo:** `App.tsx`  
**WCAG:** 2.4.1 (Bypass Blocks)  
**Problema:** No hay un enlace "Saltar al contenido" al inicio de la página. Los usuarios de teclado/lector de pantalla deben tabular por todo el header antes de llegar al contenido.  
**Corrección** (agregar al inicio del return en `App`):

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring"
>
  Skip to main content
</a>
<main id="main-content" className="dark min-h-screen bg-background text-foreground">
  …
</main>
```

---

### A-MEDIO-1: Icono decorativo en DashboardHeader sin `aria-hidden`

**Archivo:** `dashboard-header.tsx` línea ~11  
**WCAG:** 1.1.1 (Non-text Content)  
**Problema:** El `<LayoutDashboard size={18} />` dentro de un `<span>` no tiene `aria-hidden="true"`. El icono es decorativo (el texto "Financial Overview" ya comunica el propósito).  
**Corrección:**

```tsx
<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
  <LayoutDashboard size={18} />
</span>
```

---

### A-MEDIO-2: Periodo mostrado como `<span>` genérico sin contexto

**Archivo:** `dashboard-header.tsx` línea ~19  
**WCAG:** 4.1.2 (Name, Role, Value)  
**Problema:** El badge del periodo es un `<span>` sin identificación. Un lector de pantalla no sabe qué representa ese valor.  
**Corrección:**

```tsx
<span
  className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
  aria-label={`Reporting period: ${period}`}
>
  {period}
</span>
```

---

### A-BAJO-1: Sin respeto por `prefers-reduced-motion`

**Archivo:** `index.css`  
**WCAG:** 2.3 (Seizures and Physical Reactions)  
**Problema:** El skeleton tiene `animate-pulse` y la tarjeta tiene `transition-colors`. No hay consulta de medios para reducir animaciones.  
**Corrección** (agregar a `index.css`):

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

### A-BAJO-2: Título de página genérico "frontend"

**Archivo:** `index.html` línea ~6  
**WCAG:** 2.4.2 (Page Titled)  
**Problema:** `<title>frontend</title>` no describe el contenido.  
**Corrección:**

```html
<title>Financial Dashboard — Executive Metrics</title>
```

---

## 🔵 Performance React / Bundle — Hallazgos

Basado en `vercel-react-best-practices` (prioridad CRITICAL → LOW).

### P-CRÍTICO-1: `computeKPIs` hace dos iteraciones completas sobre `movements`

**Regla:** `js-combine-iterations`  
**Archivo:** `financial-utils.ts`  
**Problema:** Se ejecutan dos `filter().reduce()` separados sobre el mismo array. Con 360+ movimientos el costo es bajo, pero con conjuntos grandes escala mal.  
**Corrección** (single pass con `reduce`):

```ts
export function computeKPIs(movements: FinancialMovement[]): KPIMetrics {
  const { totalIncome, totalOutcome } = movements.reduce(
    (acc, m) => {
      if (m.operation_type === "income") acc.totalIncome += m.amount;
      else acc.totalOutcome += m.amount;
      return acc;
    },
    { totalIncome: 0, totalOutcome: 0 },
  );

  const profit = totalIncome - totalOutcome;
  const profitPercent = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

  return { totalIncome, totalOutcome, profit, profitPercent };
}
```

---

### P-ALTO-1: `CustomTooltip` sin `React.memo` (definido a nivel módulo pero no memoizado)

**Regla:** `rerender-memo`  
**Archivos:** `income-outcome-chart.tsx`, `profit-percent-chart.tsx`  
**Problema:** Aunque `CustomTooltip` está definido fuera del componente, cada vez que el tooltip se activa Recharts crea un nuevo elemento. El componente tooltip no está memoizado, por lo que cualquier re-render del padre reconstruye su árbol.  
**Corrección** (en ambos archivos):

```tsx
const CustomTooltip = React.memo(function CustomTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
  // ... mismo contenido ...
});
```

---

### P-MEDIO-1: `income-outcome-chart.tsx` y `profit-percent-chart.tsx` tienen lógica duplicada

**Regla:** `bundle-barrel-imports` (indirecto — componente compartido evitaría código duplicado)  
**Problema:** Ambos gráficos tienen un `CustomTooltip` casi idéntico y la misma estructura de skeleton/loading. El bundle contiene código repetido.  
**Corrección:** Extraer un componente compartido `ChartTooltip` (o un `DashboardChart` wrapper) en un archivo separado dentro de `components/dashboard/`.

---

### P-BAJO-1: Los `Skeleton` en los charts no se detienen con `prefers-reduced-motion`

**Regla:** No incluida directamente en Vercel, pero relacionada con DX  
**Problema:** `animate-pulse` de Tailwind sigue ejecutándose aunque el usuario prefiera reducir movimiento. Combinar con la corrección A-BAJO-1 resuelve ambos.

---

## ✅ Lo que ya está bien

| Aspecto | Detalle |
|---------|---------|
| **Landmarks semánticos** | App.tsx usa `<main>`, `<section>` con `aria-label` descriptivo |
| **Idioma de página** | `<html lang="en">` correcto |
| **Data fetching** | Un solo `useEffect` sin dependencias variables — evita re-fetches |
| **No hay barrel files** | Importan rutas directas (`./financial-types`), no `./index` |
| **Contraste de color** | Variables OKLCH con valores que superan 4.5:1 en modo dark y light |
| **Estados vacío/loading/error** | Los tres están cubiertos en todos los componentes |
| **No hay componentes inline** | Todos los componentes están definidos a nivel módulo ✅ |
| **Formato condicional ternario** | Usan `{condición ? <A /> : null}`, no `&&` que puede renderizar `0` |
| **Textos con significado** | Helper texts, card descriptions y títulos de gráfica describen el contenido |

---

## Acciones recomendadas (orden sugerido)

1. **CRÍTICO** — Agregar `role="alert"` al mensaje de error en `App.tsx`
2. **CRÍTICO** — Agregar `role="img"` y `aria-label` / `<title>` a las gráficas Recharts
3. **ALTO** — Agregar `:focus-visible` global en `index.css`
4. **ALTO** — Agregar skip link en `App.tsx`
5. **ALTO** — Combinar iteraciones en `computeKPIs`
6. **MEDIO** — Agregar `aria-hidden="true"` al icono decorativo del header
7. **MEDIO** — Agregar `aria-label` al badge de periodo
8. **MEDIO** — Memoizar `CustomTooltip` en ambos charts
9. **BAJO** — Agregar `prefers-reduced-motion`
10. **BAJO** — Renombrar `<title>` en `index.html`
11. **BAJO** — Extraer `ChartTooltip` compartido