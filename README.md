<div align="center">
  <img src="https://img.icons8.com/clouds/200/bar-chart.png" alt="Torre de Control Logo">
  <h1>🌟 Torre de Control - KPI SIACO 🌟</h1>
  <p><em>Un dashboard interactivo y moderno (estilo PowerBI) para la visualización y análisis de los Indicadores Clave de Rendimiento (KPI) en operaciones de Comercio Exterior.</em></p>
  
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
    <img src="https://img.shields.io/badge/jsPDF-000000?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" alt="jsPDF" />
  </p>
</div>

<hr />

## 🚀 Características Principales

- 🎨 **Interfaz Premium:** Diseño elegante (glassmorphism), modo oscuro optimizado, tarjetas de KPIs flotantes, tooltips interactivos y animaciones fluidas de entrada (efecto cascada). Todo el CSS está limpio y estrictamente modularizado en `style.css`.
- 🔗 **Filtros Globales Interactivos (Cross-Filtering):** Haz clic en cualquier porción de torta, punto o barra para filtrar todos los paneles, métricas y tablas en tiempo real. ¡Todo está conectado!
- 🔒 **Carga Local y Segura:** Procesa tus archivos Excel (`.xls`, `.xlsx`) directamente en el navegador de tu computadora sin enviar datos a la nube, priorizando la privacidad.
- 📥 **Exportación Profesional a PDF:** Exportación nativa integrada usando `html2canvas` y `jsPDF`. Captura informes paginados, con formato y calidad perfecta (Landscape A4) con tan solo un clic.
- ♿ **Accesibilidad Universal (a11y):** Etiquetas ARIA y navegación inclusiva en toda la interfaz para asegurar una excelente experiencia en dispositivos de asistencia.

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
| 🌎 | **COO (Ahorros)** | Mapa térmico mundial interactivo de ahorros arancelarios en USD, detallando orígenes y subpartidas. |
| 🗄️ | **Datos Detallados** | Consola de auditoría tipo "Data Table" con búsquedas dinámicas, ordenamiento inteligente y exportación directa a Excel. |

<br>

## ⚙️ Tecnologías & Librerías

El sistema ha sido construido bajo una arquitectura *Frontend-Only* (cliente) que asegura cero latencia de servidor y 100% privacidad:

- 💻 **Vanilla JS / HTML / CSS:** Lógica cruda y veloz, con código altamente refactorizado (SRP).
- 📊 **[Chart.js](https://www.chartjs.org/):** Motor de renderizado principal (Donas, Barras, Líneas) con tooltips HTML y soporte `datalabels`.
- 📗 **[SheetJS (XLSX)](https://sheetjs.com/):** Librería líder para transformar el binario de Excel a JSON en milisegundos.
- 📄 **[jsPDF](https://parall.ax/products/jspdf) y [html2canvas](https://html2canvas.hertzen.com/):** Motores gráficos para la generación y renderizado de Reportes de Inteligencia a documentos PDF.
- 🗺️ **[jsVectorMap](https://jvm-docs.vercel.app/):** Pintado de polígonos vectoriales para el mapa interactivo del módulo COO.

<br>

## 📂 Guía de Uso (Carga de Archivos)

Para alimentar la base de datos local de la Torre de Control, arrastra o selecciona los **3 reportes madre** exportados desde tu sistema:

1. 📄 `REPORTE.xls` *(o xlsx)*
2. 📄 `STATUS.xlsx`
3. 📄 `ahorro arancel.xls` *(o xlsx)*

> **💡 Pro-Tip:** Selecciona todos los archivos al mismo tiempo usando `Ctrl` o arrastrándolos juntos sobre el área de carga. El motor estructurará y consolidará la data automáticamente. Para exportar, simplemente utiliza el botón de "Exportar PDF / Imprimir" localizado en la parte superior derecha.

<br>

## 🎨 Aspecto Visual y Personalización

Esta aplicación implementa una **Paleta Curada (`PALETTE` en `app.js`)** centrada en la experiencia de usuario (UI/UX):
- 🟢 **Éxito (SI / Cumple):** Verdes vibrantes.
- 🔴 **Peligro (NO / Rechazado):** Rojos alertas.
- 🟡 **Alerta (Vencido):** Amarillos cálidos.
- 🔵 **Corporativo:** Azules, cyan y tonos atardecer para el escalonado de datos.

---
<div align="center">
  <i>Desarrollado para la optimización y control total de procesos logísticos. Arquitectura robusta, limpia y veloz.</i>
</div>
