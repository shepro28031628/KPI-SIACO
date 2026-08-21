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

  // 2. Gráfico 1: Distribución por Estado del Producto (Torta con Valores y Porcentajes)
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
    const totalEst = dataValues.reduce((a, b) => a + b, 0);
    const stateColors = {
      'COMPLETO': '#10b981',
      'CLASIFICADO': '#0284c7',
      'REQUERIDO': '#f59e0b',
      'TIPIFICADO': '#8b5cf6',
      'PENDIENTE': '#ef4444'
    };
    const bgColors = labels.map(l => stateColors[l] || '#64748b');

    App.charts.chartClasifEstados = new Chart(ctxEstados, {
      type: 'pie',
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
        layout: { padding: 15 },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              font: { size: 12, weight: '600' },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const val = data.datasets[0].data[i];
                    const pct = totalEst > 0 ? ((val / totalEst) * 100).toFixed(1) : 0;
                    return {
                      text: `${label}: ${val} (${pct}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: '#ffffff',
                      lineWidth: 1,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw || 0;
                const pct = totalEst > 0 ? ((val / totalEst) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${val} SKUs (${pct}%)`;
              }
            }
          },
          datalabels: {
            display: (ctx) => {
              const val = ctx.dataset.data[ctx.dataIndex] || 0;
              return totalEst > 0 && (val / totalEst) >= 0.12;
            },
            color: '#ffffff',
            font: { weight: 'bold', size: 13 },
            formatter: (val) => {
              const pct = totalEst > 0 ? ((val / totalEst) * 100).toFixed(1) : 0;
              return `${val} (${pct}%)`;
            }
          }
        }
      }
    });
  }

  // 3. Gráfico 2: Proporción de SKUs con Restricción Legal (Torta con Valores y Porcentajes)
  let aplicaSi = 0;
  let aplicaNo = 0;
  enrichedRows.forEach(r => {
    if (r.aplicaRestriccion === 'SI') aplicaSi++;
    else aplicaNo++;
  });
  const totalAplica = aplicaSi + aplicaNo;

  destroyChart('chartClasifAplica');
  const ctxAplica = document.getElementById('chartClasifAplica');
  if (ctxAplica && typeof Chart !== 'undefined') {
    App.charts.chartClasifAplica = new Chart(ctxAplica, {
      type: 'pie',
      data: {
        labels: ['Aplica Restricción (SÍ)', 'Sin Restricción (NO)'],
        datasets: [{
          data: [aplicaSi, aplicaNo],
          backgroundColor: ['#ea580c', '#0284c7'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 15 },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              font: { size: 12, weight: '600' },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const val = data.datasets[0].data[i];
                    const pct = totalAplica > 0 ? ((val / totalAplica) * 100).toFixed(1) : 0;
                    return {
                      text: `${label}: ${val} (${pct}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: '#ffffff',
                      lineWidth: 1,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw || 0;
                const pct = totalAplica > 0 ? ((val / totalAplica) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${val} SKUs (${pct}%)`;
              }
            }
          },
          datalabels: {
            display: true,
            color: '#ffffff',
            font: { weight: 'bold', size: 12 },
            formatter: (val) => {
              if (val === 0) return '';
              const pct = totalAplica > 0 ? ((val / totalAplica) * 100).toFixed(1) : 0;
              return `${val}\n(${pct}%)`;
            }
          }
        }
      }
    });
  }

  // 4. Gráfico 3: Tendencia y Frecuencia de Restricciones Legales (Barra Horizontal Ancha)
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
          label: 'Cantidad de SKUs con Restricción',
          data: restrValues.length > 0 ? restrValues : [0],
          backgroundColor: '#0284c7',
          hoverBackgroundColor: '#0369a1',
          borderRadius: 6,
          maxBarThickness: 34
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 70, left: 10, top: 10, bottom: 10 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw} SKUs con esta restricción legal`
            }
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'right',
            color: '#1e293b',
            font: { weight: 'bold', size: 12 },
            formatter: (v) => v > 0 ? `${v} SKUs` : ''
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 12 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: '600' }, color: '#1e293b' }
          }
        }
      }
    });
  }
};
