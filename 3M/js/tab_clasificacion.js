// ==========================================
// MÓDULO CLASIFICACIÓN ARANCELARIA Y RESTRICCIONES LEGALES
// ==========================================
ChartManager.renderClasificacion = function() {
  const clasifData = App.raw.clasificacion || { datosGenerales: [], restriccionesLegales: [] };
  const allDatosGenerales = clasifData.datosGenerales || [];
  const allRestricciones = clasifData.restriccionesLegales || [];

  // Mapa de restricciones por SKU para cruce rápido
  const restrMap = {};
  allRestricciones.forEach(r => {
    if (!restrMap[r.sku]) restrMap[r.sku] = [];
    restrMap[r.sku].push(r);
  });

  // Filtros interactivos de estado y mes
  if (!App._clasifFilters) {
    App._clasifFilters = {
      mes: 'julio', // Por defecto Julio como solicita el requerimiento
      estado: 'TODOS',
      aplica: 'TODOS',
      search: ''
    };
  }

  // Meses disponibles
  const mesesDisponibles = [...new Set(allDatosGenerales.map(r => r.mes).filter(Boolean))];
  if (!mesesDisponibles.includes('julio') && mesesDisponibles.length > 0) {
    if (App._clasifFilters.mes === 'julio' && !mesesDisponibles.includes('julio')) {
      App._clasifFilters.mes = mesesDisponibles[0];
    }
  }

  // Renderizar selectores de filtros si existen
  const selectMes = document.getElementById('clasifFilterMes');
  if (selectMes && selectMes.options.length <= 1) {
    selectMes.innerHTML = '<option value="TODOS">Todos los meses</option>';
    mesesDisponibles.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      if (m === App._clasifFilters.mes) opt.selected = true;
      selectMes.appendChild(opt);
    });
    selectMes.addEventListener('change', (e) => {
      App._clasifFilters.mes = e.target.value;
      ChartManager.renderClasificacion();
    });
  }

  const selectEstado = document.getElementById('clasifFilterEstado');
  if (selectEstado && selectEstado.options.length <= 1) {
    const estados = [...new Set(allDatosGenerales.map(r => r.estado).filter(Boolean))];
    selectEstado.innerHTML = '<option value="TODOS">Todos los estados</option>';
    estados.forEach(est => {
      const opt = document.createElement('option');
      opt.value = est;
      opt.textContent = est;
      selectEstado.appendChild(opt);
    });
    selectEstado.addEventListener('change', (e) => {
      App._clasifFilters.estado = e.target.value;
      ChartManager.renderClasificacion();
    });
  }

  const selectAplica = document.getElementById('clasifFilterAplica');
  if (selectAplica && !selectAplica._bound) {
    selectAplica._bound = true;
    selectAplica.addEventListener('change', (e) => {
      App._clasifFilters.aplica = e.target.value;
      ChartManager.renderClasificacion();
    });
  }

  const searchInput = document.getElementById('clasifSearchInput');
  if (searchInput && !searchInput._bound) {
    searchInput._bound = true;
    searchInput.addEventListener('input', (e) => {
      App._clasifFilters.search = e.target.value.toLowerCase().trim();
      ChartManager.renderClasificacion();
    });
  }

  // Filtrado de filas de datos generales
  let rowsGenerales = allDatosGenerales;
  if (App._clasifFilters.mes !== 'TODOS') {
    rowsGenerales = rowsGenerales.filter(r => r.mes === App._clasifFilters.mes);
  }
  if (App._clasifFilters.estado !== 'TODOS') {
    rowsGenerales = rowsGenerales.filter(r => r.estado === App._clasifFilters.estado);
  }

  // Cruce con restricciones
  let enrichedRows = rowsGenerales.map(g => {
    const restrs = restrMap[g.sku] || [];
    const aplicaRestr = restrs.some(r => r.aplica === 'SI');
    const nombresRestr = restrs.map(r => r.nombrerestriccion).filter(Boolean);
    return {
      ...g,
      aplicaRestriccion: aplicaRestr ? 'SI' : (restrs.length > 0 ? 'NO' : 'SIN RESTRICCIÓN'),
      restricciones: nombresRestr.length > 0 ? nombresRestr.join(', ') : 'Ninguna',
      rawRestricciones: nombresRestr
    };
  });

  if (App._clasifFilters.aplica === 'SI') {
    enrichedRows = enrichedRows.filter(r => r.aplicaRestriccion === 'SI');
  } else if (App._clasifFilters.aplica === 'NO') {
    enrichedRows = enrichedRows.filter(r => r.aplicaRestriccion !== 'SI');
  }

  if (App._clasifFilters.search) {
    const q = App._clasifFilters.search;
    enrichedRows = enrichedRows.filter(r => 
      r.sku.toLowerCase().includes(q) ||
      r.estado.toLowerCase().includes(q) ||
      r.restricciones.toLowerCase().includes(q)
    );
  }

  // 1. KPIS Superiores
  const totalSKUs = rowsGenerales.length;
  const completosCount = rowsGenerales.filter(r => r.estado === 'COMPLETO').length;
  const clasificadosCount = rowsGenerales.filter(r => r.estado === 'CLASIFICADO').length;
  const tipificadosCount = rowsGenerales.filter(r => r.estado === 'TIPIFICADO').length;
  const requeridosCount = rowsGenerales.filter(r => r.estado === 'REQUERIDO' || r.estado === 'PENDIENTE').length;
  
  // SKUs de la muestra con restricción legal
  const skusConRestr = enrichedRows.filter(r => r.aplicaRestriccion === 'SI').length;
  const pctConRestr = totalSKUs > 0 ? ((skusConRestr / totalSKUs) * 100).toFixed(1) : '0.0';

  if (document.getElementById('valClasifTotalSKU')) {
    document.getElementById('valClasifTotalSKU').textContent = totalSKUs;
  }
  if (document.getElementById('valClasifCompletos')) {
    document.getElementById('valClasifCompletos').textContent = completosCount;
  }
  if (document.getElementById('valClasifClasificados')) {
    document.getElementById('valClasifClasificados').textContent = clasificadosCount;
  }
  if (document.getElementById('valClasifTipificados')) {
    document.getElementById('valClasifTipificados').textContent = tipificadosCount;
  }
  if (document.getElementById('valClasifRequeridos')) {
    document.getElementById('valClasifRequeridos').textContent = requeridosCount;
  }
  if (document.getElementById('valClasifConRestriccion')) {
    document.getElementById('valClasifConRestriccion').textContent = `${skusConRestr} (${pctConRestr}%)`;
  }

  // 2. Gráfico 1: Distribución por Estado del Producto
  const countEstados = {};
  rowsGenerales.forEach(r => {
    const est = r.estado || 'SIN ESTADO';
    countEstados[est] = (countEstados[est] || 0) + 1;
  });

  destroyChart('chartClasifEstados');
  const ctxEstados = document.getElementById('chartClasifEstados');
  if (ctxEstados && typeof Chart !== 'undefined') {
    const labels = Object.keys(countEstados);
    const dataValues = Object.values(countEstados);
    const stateColors = {
      'COMPLETO': '#10b981',
      'CLASIFICADO': '#0284c7',
      'REQUERIDO': '#f59e0b',
      'TIPIFICADO': '#8b5cf6',
      'PENDIENTE': '#ef4444'
    };
    const bgColors = labels.map(l => stateColors[l] || '#64748b');

    App.charts.chartClasifEstados = new Chart(ctxEstados, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
          datalabels: {
            display: true,
            color: '#ffffff',
            font: { weight: 'bold', size: 12 },
            formatter: (val) => val > 0 ? val : ''
          }
        }
      }
    });
  }

  // 3. Gráfico 2: Tendencia y Ranking de Restricciones Legales (Columna D)
  const countRestricciones = {};
  const currentSKUs = new Set(rowsGenerales.map(r => r.sku));
  
  allRestricciones.forEach(r => {
    if ((currentSKUs.size === 0 || currentSKUs.has(r.sku)) && r.nombrerestriccion && r.aplica === 'SI') {
      const nom = r.nombrerestriccion;
      countRestricciones[nom] = (countRestricciones[nom] || 0) + 1;
    }
  });

  const sortedRestr = Object.entries(countRestricciones).sort((a, b) => b[1] - a[1]);
  const restrLabels = sortedRestr.map(x => x[0]);
  const restrValues = sortedRestr.map(x => x[1]);

  destroyChart('chartClasifTendenciaRestr');
  const ctxRestr = document.getElementById('chartClasifTendenciaRestr');
  if (ctxRestr && typeof Chart !== 'undefined') {
    App.charts.chartClasifTendenciaRestr = new Chart(ctxRestr, {
      type: 'bar',
      data: {
        labels: restrLabels.length > 0 ? restrLabels : ['Sin restricciones registradas'],
        datasets: [{
          label: 'Frecuencia / Tendencia de Restricción',
          data: restrValues.length > 0 ? restrValues : [0],
          backgroundColor: '#0284c7',
          borderRadius: 4,
          maxBarThickness: 28
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'right',
            color: '#1e293b',
            font: { weight: 'bold', size: 11 },
            formatter: (v) => v > 0 ? v : ''
          }
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, ticks: { precision: 0 } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  // 4. Gráfico 3: Proporción de SKUs con Restricción Legal (Aplica: Sí vs No)
  let aplicaSi = 0;
  let aplicaNo = 0;
  enrichedRows.forEach(r => {
    if (r.aplicaRestriccion === 'SI') aplicaSi++;
    else aplicaNo++;
  });

  destroyChart('chartClasifAplica');
  const ctxAplica = document.getElementById('chartClasifAplica');
  if (ctxAplica && typeof Chart !== 'undefined') {
    App.charts.chartClasifAplica = new Chart(ctxAplica, {
      type: 'doughnut',
      data: {
        labels: ['Aplica Restricción (SÍ)', 'Sin Restricción (NO)'],
        datasets: [{
          data: [aplicaSi, aplicaNo],
          backgroundColor: ['#ea580c', '#3b82f6'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          datalabels: {
            display: true,
            color: '#ffffff',
            font: { weight: 'bold', size: 12 },
            formatter: (v) => v > 0 ? v : ''
          }
        }
      }
    });
  }

  // 5. Tabla de Detalle
  const tbody = document.getElementById('tblClasifBody');
  const countBadge = document.getElementById('clasifTableCount');
  if (countBadge) countBadge.textContent = `${enrichedRows.length} SKUs`;

  if (tbody) {
    tbody.innerHTML = '';
    if (enrichedRows.length > 0) {
      const fragment = document.createDocumentFragment();
      enrichedRows.forEach(r => {
        const tr = document.createElement('tr');
        
        let stateBadgeClass = 'badge-blue';
        if (r.estado === 'COMPLETO') stateBadgeClass = 'badge-green';
        else if (r.estado === 'REQUERIDO') stateBadgeClass = 'badge-orange';
        else if (r.estado === 'TIPIFICADO') stateBadgeClass = 'badge-purple';

        let restrBadge = r.aplicaRestriccion === 'SI' 
          ? `<span class="pbi-badge badge-orange" style="font-weight:700;">⚠️ SÍ APLICA</span>` 
          : `<span class="pbi-badge badge-green">✓ NO</span>`;

        const fCreacionStr = r.fechacreacion instanceof Date ? r.fechacreacion.toISOString().slice(0, 10) : (r.fechacreacion || '-');
        const fClasifStr = r.fechaclasificacion instanceof Date ? r.fechaclasificacion.toISOString().slice(0, 10) : (r.fechaclasificacion || '-');

        tr.innerHTML = `
          <td><strong>${r.sku}</strong></td>
          <td><span class="pbi-badge ${stateBadgeClass}">${r.estado}</span></td>
          <td>${r.mes ? r.mes.charAt(0).toUpperCase() + r.mes.slice(1) : '-'}</td>
          <td>${fCreacionStr}</td>
          <td>${fClasifStr}</td>
          <td style="text-align:center;">${restrBadge}</td>
          <td><small style="color:var(--text-muted, #64748b);">${r.restricciones}</small></td>
        `;
        fragment.appendChild(tr);
      });
      tbody.appendChild(fragment);
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No se encontraron SKUs con los filtros seleccionados</td></tr>';
    }
  }
};
