<div align="center">
  <img src="https://img.icons8.com/clouds/200/bar-chart.png" alt="Torre de Control Logo">
  <h1>🌟 Torre de Control - KPI SIACO 🌟</h1>
  <p><em>Un dashboard interactivo y moderno (estilo PowerBI) para la visualización y análisis de los Indicadores Clave de Rendimiento (KPI) en operaciones de Comercio Exterior.</em></p>
  
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  </p>
</div>

<hr />

## 🚀 Características Principales

- 🎨 **Interfaz Premium:** Diseño elegante (glassmorphism), modo oscuro optimizado, tarjetas de KPIs flotantes, tooltips interactivos y animaciones fluidas de entrada (efecto cascada).
- 🔗 **Filtros Globales Interactivos (Cross-Filtering):** Haz clic en cualquier porción de torta, punto o barra para filtrar todos los paneles, métricas y tablas en tiempo real. ¡Todo está conectado!
- 🔒 **Carga Local y Segura:** Procesa tus archivos Excel (`.xls`, `.xlsx`) directamente en el navegador de tu computadora sin enviar datos a la nube.
- 📥 **Exportación Profesional:** Botones integrados en cada gráfica para descargarla como imagen `PNG` ideal para presentaciones, o descargar reportes en `Excel`.

<br>

## 📊 Módulos y Pestañas

El dashboard está dividido analíticamente en las siguientes áreas de enfoque:

| Ícono | Módulo | Descripción |
|:---:|---|---|
| 📈 | **Procesos** | Vista consolidada y holística de los indicadores de gestión, volumen documental y modos de transporte. |
| ⚡ | **Agilidad** | Análisis detallado de tiempos operativos (*Total Time*, *Despacho Time*) y justificaciones de retrasos. |
| 💳 | **Facturación** | Seguimiento exhaustivo a las métricas de cumplimiento y tiempos en procesos de facturación. |
| 🔍 | **Inspección** | Análisis sobre la cantidad de revisiones físicas, cruce de información y evaluación de los aforos. |
| 📝 | **Registros** | Medición de la gestión de registros documentales y SKUs, identificando picos y cuellos de botella. |
| 🌎 | **COO (Ahorros)** | Mapa térmico mundial (interactivo) de ahorros arancelarios en USD, detallando orígenes y subpartidas. |
| 🗄️ | **Datos Detallados** | Consola de auditoría tipo "Data Table" con búsquedas dinámicas, ordenamiento, *badges* inteligentes y paginación. |

<br>

## ⚙️ Tecnologías & Librerías

El sistema ha sido construido bajo una arquitectura *Frontend-Only* (cliente) que asegura cero latencia de servidor y 100% privacidad:

- 💻 **Vanilla JS / HTML / CSS:** Lógica cruda y veloz, sin frameworks pesados.
- 📊 **[Chart.js](https://www.chartjs.org/):** Motor de renderizado principal para Donas, Barras, Líneas y Áreas, con tooltips HTML y soporte `datalabels`.
- 📗 **[SheetJS (XLSX)](https://sheetjs.com/):** Librería líder para transformar el binario de Excel a JSON en milisegundos.
- 🗺️ **[jsVectorMap](https://jvm-docs.vercel.app/):** Pintado de polígonos vectoriales para el mapa interactivo del módulo COO.

<br>

## 📂 Guía de Uso (Carga de Archivos)

Para alimentar la base de datos local de la Torre de Control, arrastra o selecciona los **3 reportes madre** exportados desde tu sistema:

1. 📄 `REPORTE.xls` *(o xlsx)*
2. 📄 `STATUS.xlsx`
3. 📄 `ahorro arancel.xls` *(o xlsx)*

> **💡 Pro-Tip:** Selecciona todos los archivos al mismo tiempo usando `Ctrl` o arrastrándolos juntos sobre el área de carga. ¡El motor consolidará la data automáticamente!

<br>

## 🎨 Aspecto Visual y Personalización

Esta aplicación no usa colores al azar. Implementa una **Paleta Curada (`PALETTE` en `app.js`)**:
- 🟢 **Éxito (SI / Cumple):** Verdes vibrantes.
- 🔴 **Peligro (NO / Rechazado):** Rojos alertas.
- 🟡 **Alerta (Vencido):** Amarillos cálidos.
- 🔵 **Corporativo:** Azules, cyan y tonos atardecer para el escalonado de datos.

---
<div align="center">
  <i>Desarrollado para la optimización y control total de procesos logísticos.</i>
</div>
