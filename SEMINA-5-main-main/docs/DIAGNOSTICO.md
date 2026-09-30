# Diagnóstico Global — CloudOps

Auditoría de UI/UX y de modelo de datos previa a la refactorización integral.

## 1. Problemas de UI/UX encontrados

### 1.1 Sin sistema de diseño
- Cada vista reimplementaba botones, badges, tarjetas y tablas con clases Tailwind ad-hoc
  (`rounded-xl border border-border bg-white p-4 shadow-sm ...`), generando decenas de variantes
  visualmente casi idénticas.
- Botones de acción usaban gradientes inline repetidos
  (`bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 ...` ×40+ en el código base).
- Píldoras de filtro y tabs con 6+ copias distintas del mismo estilo activo/inactivo.
- `text-2xl` / `text-lg` / `text-base` usados como "título de página" indistintamente; sin jerarquía
  eyebrow → título → subtítulo.

### 1.2 Espaciado inconsistente
- Mezcla de `space-y-6`, `space-y-8`, `mt-4`, `mt-6` y hack de margen negativo
  (`-m-4 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8`) en Security para simular el padding de página.
- Grids con `gap-4` junto a otros con `gap-6` en la misma vista.

### 1.3 Encabezados duplicados
- El `Layout` mostraba un `h1` con el nombre del módulo y cada página volvía a declarar su propio
  `h1` → doble jerarquía visual y conflictos de accesibilidad.
- Cabeceras de tabla escritas a mano (`th ... text-[11px] font-semibold uppercase`) en vez de un
  `.data-table` común.

### 1.4 Color sin semántica
- Estados "Aprobada/En revisión/Borrador" no mapeaban de forma uniforme a verde/amarillo/rojo.
- Inconsistencia `StatusBadge` vs badges manuales para el mismo estado.
- Formularios sin estado `invalid`/error unificado.

### 1.5 Componentes duplicados
- 7 variantes de "tarjeta de métrica" distintas.
- Tablas reescritas por página (Security ×2, Network ×2, Services, Planning, Costs, Infra).

## 2. Problemas de modelo de datos

### 2.1 Sin fuente única de verdad
- Cada página definía sus propios arreglos de proyectos, costos y servicios → números distintos
  para la misma métrica entre Dashboard, Costs y Planning.
- KPIs del dashboard hardcodeados en el componente, desconectados del inventario real de servidores.

### 2.2 Presupuesto y costo divergentes
- `MONTHLY_BUDGET` definido en múltiples archivos con valores distintos.
- Costo mensual calculado a veces con 730 h/mes y a veces con 720/744.

### 2.3 Estado de proyectos no sincronizado
- El store de propuestas podía cambiar un estado ("aprobada") sin que el Dashboard ni Costs lo
  reflejaran, porque leían de arreglos estáticos.

### 2.4 Metadatos de estado dispersos
- Etiquetas de etapa/prioridad/estado repetidas con diferente redacción
  ("En revisión" vs "En Revision" vs "revisión").

## 3. Solución implementada

| Entregable | Archivo | Descripción |
|---|---|---|
| Sistema de diseño | `src/styles/tailwind.css` | Capa `@layer components`: `.page`, `.section-card`, `.btn*`, `.badge*`, `.chip`, `.segmented*`, `.field/input/select`, `.table-wrap/.data-table`, `.empty-state`, `.hint-bar` |
| Tokens | `tailwind.config.js` | Paleta, escala tipográfica, radios `card/control`, sombras, keyframes |
| Datos únicos | `src/data/cloudOpsData.ts` | 6 proyectos maestros + derivadores (`portfolioTotals`, `projectMonthlyCost`, `serviceUsage`, `networkOverview`, `securityOverview`) |
| Store conectado | `src/store/cloudStore.tsx` | `projects` (estado vivo) y `portfolio` (KPIs globales) derivados de la fuente única |
| Primitivas UI | `src/components/ui/index.tsx` | `Badge`, `Button`, `PageHeader`, `Section`, `ChipTabs`, `Field`, inputs, `MetricTile`, `ProgressBar`, `EmptyState` |
| Navegación | `src/config/navigation.ts` | `NAV_ITEMS`, `MODULE_META` → títulos y breadcrumb centralizados |
| Tarjeta de proyecto | `src/components/ProjectCard.tsx` | Reutilizada en Dashboard y Costs |

### Vistas refactorizadas
Dashboard, Planning, Costs, Infrastructure, Security, Network, Services, Config — todas usan
`.page` + `PageHeader` + `Section`, sin `h1` duplicado y sin estilos ad-hoc de botón/tabla/badge.

### Correcciones de datos
- `CostCategory` ampliado con `'Security'`; `COST_CATEGORY_LABELS` completo.
- `CloudServer.projectId` para agrupar inventario por proyecto.
- Presupuesto global derivado: `MONTHLY_BUDGET = portfolioTotals(CLOUD_PROJECTS).monthlyBudget`.
- `Security` checklist persistido en `setSecurityControl` y conectado al score.

## 4. Verificación

```
npx tsc --noEmit -p tsconfig.json   # EXIT: 0 (sin errores)
npx vite build                       # BUILD: ✓ 2309 módulos
```

## 5. Reglas de mantenimiento
1. Toda métrica nueva se deriva de `cloudOpsData.ts` — nunca de arreglos locales en la página.
2. Toda acción usa `Button`; nunca gradientes inline.
3. Toda tabla se envuelve en `.table-wrap` + `data-table`.
4. Un solo `h1` por vista, provisto por `PageHeader`; el breadcrumb lo da `Header`.
5. Estados visuales solo vía `STATUS_META` / `Tone`.
