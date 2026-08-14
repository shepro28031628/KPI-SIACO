# KPI GRUPO 1436 - SANDRA MILENA URBINA GONZALEZ
## Portal Central de Torres de Control COMEX

Bienvenido al repositorio oficial del **Portal Central de Comercio Exterior (COMEX)** para la gestión y monitoreo de indicadores de desempeño (KPIs), tiempos de agilidad, facturación, inspecciones y beneficios de licencias/COO.

Este proyecto consolida los dashboards de comercio exterior para las líneas operativas:
1. **Proyecto 3M** (`./3M/index.html`) - Torre de control, gestión de registros, tiempos de aprobación, procesos y ahorros COO.
2. **Proyecto Grupo Linde** (`./Grupo Linde/index.html` / `./Grupo Linde/registros.html`) - Gestión de indicadores, agilidad, facturación y VUCE.
3. **Kpi Grupo** (`./Kpi Grupo/index.html`)

---

## 🚀 Despliegue en GitHub Pages

El proyecto está diseñado y estructurado para publicarse de forma estática en **GitHub Pages**.

### Pasos para publicar el proyecto en GitHub:

1. **Inicializar y subir los cambios a GitHub**:
   Si aún no has vinculado tu repositorio remoto, abre tu terminal y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Inicializar Portal Central de Dashboards COMEX"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

2. **Activar GitHub Pages**:
   - Ingresa a tu repositorio en **GitHub**.
   - Ve a la pestaña **Settings** (Configuración) > **Pages**.
   - En la sección **Build and deployment** > **Branch**:
     - Selecciona la rama `main` (o `master`).
     - Selecciona la carpeta `/ (root)`.
   - Haz clic en **Save** (Guardar).

3. **Acceder a la URL pública**:
   En 1 a 2 minutos, tu sitio estará disponible en:
   `https://TU_USUARIO.github.io/TU_REPOSITORIO/`

---

## 📁 Estructura del Proyecto

```text
KPI-SIACO/
├── index.html            # Portal Central / Hub principal (Selección de Proyectos)
├── css/                  # Estilos visuales del portal
├── 3M/                   # Dashboard completo para el Proyecto 3M
│   ├── index.html        # Vista interactiva principal
│   ├── dashboard.html    # Vista directa del dashboard
│   ├── data/             # Archivos Excel fuentes (STATUS.xlsx, REPORTE.xls, etc.)
│   ├── js/               # Lógica, renderizado de gráficos y default_data.js
│   └── update_cache.js   # Script para procesar Excels y actualizar caché local
├── Grupo Linde/          # Dashboard completo para el Proyecto Grupo Linde
│   ├── index.html
│   ├── registros.html    # Módulo de registros
│   ├── procesos.html     # Módulo de procesos
│   ├── agilidad.html     # Módulo de agilidad
│   ├── facturacion.html  # Módulo de facturación
│   ├── inspeccion.html   # Módulo de inspección
│   └── coo.html          # Módulo COO
├── Kpi Grupo/            # Módulo adicional de indicadores
├── .gitignore            # Archivos ignorados para Git
└── README.md             # Documentación principal del proyecto
```

---

## 📊 Características del Portal

- **Interfaz UI/UX Profesional**: Diseño responsivo con *Dark Mode*, *Glassmorphism*, gradientes sutiles e indicadores en tiempo real.
- **Acceso Directo**: Botones dedicados para navegar a los dashboards independientes de 3M y Grupo Linde.
- **Buscador en Tiempo Real**: Filtrado dinámico de proyectos e indicadores dentro del portal.
- **Compatibilidad 100% Estática**: Funciona en cualquier navegador web sin requerir servidores backend adicionales.

---
*Desarrollado para la administración de Comercio Exterior.*
