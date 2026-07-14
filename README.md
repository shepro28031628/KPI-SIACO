# Torre de Control - KPI SIACO

Un dashboard interactivo y moderno, diseñado al estilo **PowerBI**, para la visualización y análisis de los Indicadores Clave de Rendimiento (KPI) en operaciones de Comercio Exterior.

## 🚀 Características Principales

*   **Interfaz Moderna:** Diseño oscuro/claro, tarjetas de KPIs flotantes y distribución optimizada de la pantalla.
*   **Filtros Globales Interactivos (Cross-Filtering):** Permite hacer clic en cualquier sección de una gráfica (porciones de torta, puntos en líneas de tiempo o barras) y automáticamente todas las demás métricas, tablas y gráficos se filtran para reflejar la información seleccionada.
*   **Carga Local y Segura:** Procesa los datos de tus archivos Excel directamente en el navegador, sin necesidad de enviar información a servidores externos.
*   **Exportación Integrada:** Capacidad para exportar tablas a Excel y generar PDFs o vistas de presentación con un solo botón.

## 📊 Pestañas y Módulos

El dashboard está dividido en pestañas clave para una navegación fluida:

1.  **Procesos:** Vista consolidada de todos los indicadores de gestión. Volumen de documentos, modos de transporte y tiempos promedio generales.
2.  **Agilidad:** Módulo detallado para analizar tiempos de despacho (Total Time y Despacho Time), incluyendo gráficos de cumplimiento y justificaciones de retrasos.
3.  **Facturación:** Seguimiento de los KPIs de facturación con sus respectivas tablas de análisis de cumplimiento.
4.  **Inspección:** Visualización de métricas relacionadas con las inspecciones físicas, cruces con estados de aprobación y tiempos.
5.  **Registros:** Análisis específico de la creación y gestión de registros (SKU y número de registro).
6.  **COO (Certificados de Origen):** Ahorros generados (en USD) segmentados por mes, subpartida arancelaria y país de origen, con mapa interactivo mundial de proveedores.
7.  **Datos Detallados:** Visor de tablas crudas con buscador integrado y paginación para auditorías manuales.

## ⚙️ Tecnologías Utilizadas

*   **HTML5 / CSS3 / JavaScript (Vanilla):** Sin frameworks pesados para garantizar máxima velocidad y portabilidad.
*   **Chart.js:** Utilizada para renderizar gráficos interactivos (Líneas, Barras, Donas, Tortas).
*   **SheetJS (xlsx):** Motor para la lectura y procesamiento de archivos `.xls` y `.xlsx` en el lado del cliente.
*   **jsVectorMap:** Renderizado de mapa global interactivo en el módulo COO.

## 📂 Archivos Requeridos para Cargar

El sistema requiere que cargues 3 archivos Excel fundamentales generados por tus sistemas:
1.  `REPORTE.xls` (o `.xlsx`)
2.  `STATUS.xlsx`
3.  `ahorro arancel.xls` (o `.xlsx`)

> **Nota:** Puedes seleccionar los tres archivos al mismo tiempo usando el botón "Seleccionar archivos" en la pantalla de inicio.

## 🎨 Personalización

Los colores principales de las gráficas están configurados utilizando una paleta institucional optimizada para contraste y legibilidad (`PALETTE` en `app.js`). Además, los estilos (incluyendo el modo oscuro) están controlados vía variables CSS en `style.css`.
