# Graph Report - KPI-SIACO  (2026-10-09)

## Corpus Check
- 29 files · ~138,047 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 177 nodes · 218 edges · 34 communities (14 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e882b435`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Grupo Linde/js/app.js
- 3M/js/app.js
- update_cache.js
- renderModuloKPI
- parseExcelDateSafe
- parseExcelDateSafe
- renderModuloKPI
- generate_clasificacion.js
- initFilters
- 3M/README.md
- KPI GRUPO 1436 - SANDRA MILENA URBINA GONZALEZ
- Grupo Linde/README.md
- Grupo Linde/package.json
- view_vuce.js
- renderSubTable
- getYearsForRows

## God Nodes (most connected - your core abstractions)
1. `renderModuloKPI()` - 11 edges
2. `renderModuloKPI()` - 9 edges
3. `initFilters()` - 8 edges
4. `isNum()` - 7 edges
5. `parseExcelDateSafe()` - 6 edges
6. `KPI GRUPO 1436 - SANDRA MILENA URBINA GONZALEZ` - 6 edges
7. `parseReporteHTML()` - 5 edges
8. `parseReporteHTML()` - 5 edges
9. `parseExcelDateSafe()` - 5 edges
10. `numVal()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `avg()` --indirect_call--> `isNum()`  [INFERRED]
  3M/js/app.js → Grupo Linde/js/app.js
- `sum()` --indirect_call--> `isNum()`  [INFERRED]
  3M/js/app.js → Grupo Linde/js/app.js

## Import Cycles
- None detected.

## Communities (34 total, 2 thin omitted)

### Community 0 - "Grupo Linde/js/app.js"
Cohesion: 0.10
Nodes (12): App, CoreEvents, els, FilterEngine, fmtUSD(), forceRenderEverything(), holidaysSet, LocalDB (+4 more)

### Community 1 - "3M/js/app.js"
Cohesion: 0.11
Nodes (10): autoLoad(), CoreEvents, els, fmtUSD(), holidaysSet, LocalDB, renderAll(), renderTable() (+2 more)

### Community 2 - "update_cache.js"
Cohesion: 0.12
Nodes (12): dependencies, jsdom, xlsx, xlsx, fs, { JSDOM }, path, xlsx (+4 more)

### Community 3 - "renderModuloKPI"
Cohesion: 0.21
Nodes (13): avg(), sum(), avg(), countBy(), fmtInt(), getLineDatasets(), isNum(), monthKey() (+5 more)

### Community 4 - "parseExcelDateSafe"
Cohesion: 0.18
Nodes (12): findMainTable(), formatModoTransporte(), normalizeKey(), normalizeRows(), parseClasificacion(), parseDTA(), parseExcelDateSafe(), parseIndicadoresGrouped() (+4 more)

### Community 5 - "parseExcelDateSafe"
Cohesion: 0.20
Nodes (11): findMainTable(), formatModoTransporte(), normalizeKey(), normalizeRows(), parseExcelDateSafe(), parseIndicadoresGrouped(), parseNestedTable(), parseReporteHTML() (+3 more)

### Community 6 - "renderModuloKPI"
Cohesion: 0.20
Nodes (10): countBy(), filteredIndicadores(), fmtDateUTC(), fmtInt(), getLineDatasets(), monthKey(), monthLabel(), parseUTCDate() (+2 more)

### Community 7 - "generate_clasificacion.js"
Cohesion: 0.22
Nodes (8): datosGenerales, fs, output, rawDatos, rawRestricciones, restriccionesLegales, workbook, XLSX

### Community 8 - "initFilters"
Cohesion: 0.29
Nodes (8): chipRow(), clearAllFilters(), getYearsForRows(), initFilters(), loadFilters(), saveFilters(), uniqueSorted(), updateBadge()

### Community 9 - "3M/README.md"
Cohesion: 0.25
Nodes (7): 🎨 Aspecto Visual y Personalización, 🚀 Características Principales, 📂 Guía de Uso y Actualización de Datos, 📊 Módulos y Pestañas, Opción 1: Actualización de archivos en `data/` (Recomendada), Opción 2: Carga interactiva en el navegador, ⚙️ Tecnologías & Librerías

### Community 10 - "KPI GRUPO 1436 - SANDRA MILENA URBINA GONZALEZ"
Cohesion: 0.25
Nodes (7): 📊 Características del Portal, 🚀 Despliegue en GitHub Pages, 📁 Estructura del Proyecto, KPI GRUPO 1436 - SANDRA MILENA URBINA GONZALEZ, Pasos para publicar el proyecto en GitHub:, Portal Central de Torres de Control COMEX, 💻 Uso local

### Community 11 - "Grupo Linde/README.md"
Cohesion: 0.33
Nodes (5): 🎨 Aspecto Visual y Personalización, 🚀 Características Principales, 📂 Guía de Uso (Carga de Archivos), 📊 Módulos y Pestañas, ⚙️ Tecnologías & Librerías

### Community 12 - "Grupo Linde/package.json"
Cohesion: 0.50
Nodes (3): dependencies, xlsx, xlsx

### Community 13 - "view_vuce.js"
Cohesion: 0.50
Nodes (3): content, fs, match

## Knowledge Gaps
- **52 isolated node(s):** `els`, `LocalDB`, `holidaysSet`, `Uploader`, `CoreEvents` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 94 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `isNum()` connect `renderModuloKPI` to `Grupo Linde/js/app.js`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Why does `avg()` connect `renderModuloKPI` to `3M/js/app.js`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `sum()` connect `renderModuloKPI` to `3M/js/app.js`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `isNum()` (e.g. with `avg()` and `sum()`) actually correct?**
  _`isNum()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `els`, `LocalDB`, `holidaysSet` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Grupo Linde/js/app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1038961038961039 - nodes in this community are weakly interconnected._
- **Should `3M/js/app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._