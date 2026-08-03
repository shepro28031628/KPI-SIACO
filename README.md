# 🌐 Portal Central de Torres de Control - COMEX
### 📊 KPI GRUPO 1436 - SANDRA MILENA URBINA GONZALEZ

[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://github.com/)
[![HTML5](https://img.shields.io/badge/Frontend-HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/Styling-CSS3%20%2F%20Glassmorphism-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/Logic-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/Status-Active%20%2F%20Production-00E676?style=for-the-badge)](#)

---

## 📌 Descripción del Proyecto

Bienvenido al repositorio oficial del **Portal Central de Comercio Exterior (COMEX)** para la gestión, visualización y monitoreo ejecutivo de indicadores clave de desempeño (**KPIs**), tiempos de agilidad, facturación, inspecciones aduaneras y beneficios de licencias/certificados de origen (COO).

Esta plataforma centraliza los dashboards e información analítica de las líneas operativas principales:
1. 🏢 **Proyecto 3M** (`./3M/index.html`): Dashboard integral para operaciones y KPIs de 3M.
2. 🏭 **Proyecto Grupo Linde** (`./Grupo Linde/index.html`): Dashboard especializado para la gestión y monitoreo del Grupo Linde.

---

## ✨ Características Principales

* 🎨 **Interfaz UI/UX Premium**: Diseño moderno basado en *Dark Mode*, efectos de *Glassmorphism*, gradientes dinámicos y fondos animados.
* ⚡ **Sin Dependencias Complejas**: Construido 100% con estándares web nativos (*HTML5*, *CSS3*, *Vanilla JS*), garantizando máxima velocidad de carga y total independencia de servidores backend.
* 🔍 **Buscador & Filtrado Inteligente**: Búsqueda global en tiempo real dentro del portal para rápida localización de módulos y dashboards.
* ⏱️ **Reloj & Estado Operativo en Vivo**: Indicadores visuales de estado y sincronización horaria.
* 📱 **Diseño 100% Responsivo**: Adaptado perfectamente para pantallas de escritorio, laptops, tablets y dispositivos móviles.

---

## 🗂️ Estructura del Repositorio

```text
KPI-SIACO/
├── index.html            # Portal Central / Hub principal (Selección de Proyectos)
├── css/
│   └── portal.css        # Sistema de diseño, CSS Variables y estilos Glassmorphism
├── 3M/                   # Dashboard y recursos del Proyecto 3M
│   ├── index.html        # Vista principal 3M
│   ├── dashboard.html    # Panel de control e indicadores 3M
│   ├── css/              # Estilos del módulo 3M
│   ├── js/               # Lógica interactiva 3M
│   └── data/             # Datos y métricas
├── Grupo Linde/          # Dashboard y recursos del Proyecto Grupo Linde
│   ├── index.html        # Vista principal Grupo Linde
│   ├── dashboard.html    # Panel de control e indicadores Grupo Linde
│   ├── css/              # Estilos del módulo Grupo Linde
│   └── js/               # Lógica interactiva Grupo Linde
├── .gitignore            # Archivos excluidos del control de versiones
└── README.md             # Documentación oficial del proyecto
```

---

## 🚀 Guía de Despliegue en GitHub Pages

El portal está optimizado para publicarse de forma directa y estática en **GitHub Pages**.

### 🛠️ Pasos para la publicación:

1. **Subir cambios al repositorio remoto**:
   ```bash
   git init
   git add .
   git commit -m "feat: Actualización del Portal Central de Dashboards COMEX"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

2. **Configurar GitHub Pages**:
   - Ingresa a la página de tu repositorio en **GitHub**.
   - Navega a **Settings** (Configuración) > **Pages** (en el menú lateral).
   - En **Build and deployment**:
     - **Source**: Selecciona `Deploy from a branch`.
     - **Branch**: Selecciona `main` / carpeta `/ (root)`.
   - Presiona el botón **Save**.

3. **Acceso a la plataforma**:
   Tras unos instantes, la aplicación estará disponible en la URL pública:
   `https://TU_USUARIO.github.io/TU_REPOSITORIO/`

---

## 📊 Indicadores Monitoreados (KPIs)

* 📈 **Tiempos de Agilidad**: Medición de tiempos de nacionalización y desaduanamiento.
* 💰 **Facturación & Costos**: Control de liquidaciones, impuestos y costos operativos.
* 🔍 **Inspecciones Aduaneras**: Seguimiento a inspecciones físicas y documentales.
* 📜 **Licencias & COO**: Gestión de certificados de origen y cumplimiento normativo.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 Semantic Markup**: Estructura limpia y accesible.
* **CSS3 Custom Properties**: Variables globales de diseño, Flexbox, CSS Grid y animaciones CSS.
* **Vanilla JavaScript (ES6+)**: Manipulación eficiente del DOM y búsqueda dinámica sin frameworks pesados.
* **Google Fonts**: Tipografías modernas (*Plus Jakarta Sans* & *Inter*).

---

<sub>💡 *Desarrollado para la administración, análisis y monitoreo ejecutivo de Comercio Exterior.*</sub>
