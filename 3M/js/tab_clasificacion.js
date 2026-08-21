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

  // Filtrado de filas por mes
  let rowsMes = allDatosGenerales;
  if (App._clasifFilters.mes !== 'TODOS') {
    rowsMes = rowsMes.filter(r => r.mes === App._clasifFilters.mes);
  }

  // Filtrado de filas de datos generales aplicando estado
  let rowsGenerales = rowsMes;
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
  const totalSKUs = rowsMes.length;
  const completosCount = rowsMes.filter(r => r.estado === 'COMPLETO').length;
  const clasificadosCount = rowsMes.filter(r => r.estado === 'CLASIFICADO').length;
  const tipificadosCount = rowsMes.filter(r => r.estado === 'TIPIFICADO').length;
  const requeridosCount = rowsMes.filter(r => r.estado === 'REQUERIDO' || r.estado === 'PENDIENTE').length;
  
  // SKUs con restricción legal
  const skusConRestrTotal = rowsMes.map(g => restrMap[g.sku] || []).filter(restrs => restrs.some(r => r.aplica === 'SI')).length;
  const pctConRestr = totalSKUs > 0 ? ((skusConRestrTotal / totalSKUs) * 100).toFixed(1) : '0.0';

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
    document.getElementById('valClasifConRestriccion').textContent = `${skusConRestrTotal} (${pctConRestr}%)`;
  }

  // Configurar interactividad en tarjetas KPI (clic para filtrar)
  const setCardClick = (id, estadoValue, aplicaValue) => {
    const el = document.getElementById(id);
    if (el) {
      const card = el.closest('.kpi-card');
      if (card && !card._boundClick) {
        card._boundClick = true;
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          if (estadoValue !== undefined) {
            App._clasifFilters.estado = App._clasifFilters.estado === estadoValue ? 'TODOS' : estadoValue;
            if (selectEstado) selectEstado.value = App._clasifFilters.estado;
          }
          if (aplicaValue !== undefined) {
            App._clasifFilters.aplica = App._clasifFilters.aplica === aplicaValue ? 'TODOS' : aplicaValue;
            if (selectAplica) selectAplica.value = App._clasifFilters.aplica;
          }
          ChartManager.renderClasificacion();
        });
      }
    }
  };
  setCardClick('valClasifTotalSKU', 'TODOS', 'TODOS');
  setCardClick('valClasifCompletos', 'COMPLETO');
  setCardClick('valClasifClasificados', 'CLASIFICADO');
  setCardClick('valClasifTipificados', 'TIPIFICADO');
  setCardClick('valClasifRequeridos', 'REQUERIDO');
  setCardClick('valClasifConRestriccion', undefined, 'SI');

  // 2. Gráfico 1: Distribución por Estado del Producto (Torta con filtro interactivo)
  const countEstados = {};
  rowsMes.forEach(r => {
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
    
    // Aplicar opacidad si hay filtro de estado activo
    const activeEstado = App._clasifFilters.estado;
    const bgColors = labels.map(l => {
      const baseCol = stateColors[l] || '#64748b';
      if (activeEstado && activeEstado !== 'TODOS' && l !== activeEstado) {
        return baseCol + '35'; // 20% de opacidad para los no seleccionados
      }
      return baseCol;
    });

    const handleEstadoFilter = (selectedLabel) => {
      if (!selectedLabel || App._clasifFilters.estado === selectedLabel) {
        App._clasifFilters.estado = 'TODOS';
      } else {
        App._clasifFilters.estado = selectedLabel;
      }
      if (selectEstado) selectEstado.value = App._clasifFilters.estado;
      ChartManager.renderClasificacion();
    };

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
        onClick: (e, activeElements) => {
          if (activeElements.length > 0) {
            const idx = activeElements[0].index;
            handleEstadoFilter(labels[idx]);
          } else {
            handleEstadoFilter(null);
          }
        },
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
                    const isSelected = activeEstado === label;
                    return {
                      text: `${label}: ${val} (${pct}%)${isSelected ? ' ✓' : ''}`,
                      fillStyle: stateColors[label] || '#64748b',
                      strokeStyle: isSelected ? '#1e293b' : '#ffffff',
                      lineWidth: isSelected ? 2 : 1,
                      index: i
                    };
                  });
                }
                return [];
              }
            },
            onClick: (e, legendItem) => {
              const selectedLabel = labels[legendItem.index];
              handleEstadoFilter(selectedLabel);
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw || 0;
                const pct = totalEst > 0 ? ((val / totalEst) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${val} SKUs (${pct}%) - Clic para filtrar`;
              }
            }
          },
          datalabels: {
            display: (ctx) => {
              const val = ctx.dataset.data[ctx.dataIndex] || 0;
              return val > 0;
            },
            color: '#ffffff',
            font: { weight: 'bold', size: 13 },
            textStrokeColor: 'rgba(0,0,0,0.5)',
            textStrokeWidth: 2,
            formatter: (val) => val
          }
        }
      }
    });
  }

  // 3. Gráfico 2: Proporción de SKUs con Restricción Legal (Torta con filtro interactivo)
  let aplicaSi = 0;
  let aplicaNo = 0;
  rowsMes.forEach(g => {
    const restrs = restrMap[g.sku] || [];
    if (restrs.some(r => r.aplica === 'SI')) aplicaSi++;
    else aplicaNo++;
  });
  const totalAplica = aplicaSi + aplicaNo;

  destroyChart('chartClasifAplica');
  const ctxAplica = document.getElementById('chartClasifAplica');
  if (ctxAplica && typeof Chart !== 'undefined') {
    const activeAplica = App._clasifFilters.aplica;
    const baseAplicaColors = ['#ea580c', '#0284c7'];
    const bgAplicaColors = [
      activeAplica === 'NO' ? '#ea580c35' : '#ea580c',
      activeAplica === 'SI' ? '#0284c735' : '#0284c7'
    ];

    const handleAplicaFilter = (selectedAplica) => {
      if (!selectedAplica || App._clasifFilters.aplica === selectedAplica) {
        App._clasifFilters.aplica = 'TODOS';
      } else {
        App._clasifFilters.aplica = selectedAplica;
      }
      if (selectAplica) selectAplica.value = App._clasifFilters.aplica;
      ChartManager.renderClasificacion();
    };

    App.charts.chartClasifAplica = new Chart(ctxAplica, {
      type: 'pie',
      data: {
        labels: ['Aplica Restricción (SÍ)', 'Sin Restricción (NO)'],
        datasets: [{
          data: [aplicaSi, aplicaNo],
          backgroundColor: bgAplicaColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 15 },
        onClick: (e, activeElements) => {
          if (activeElements.length > 0) {
            const idx = activeElements[0].index;
            handleAplicaFilter(idx === 0 ? 'SI' : 'NO');
          } else {
            handleAplicaFilter(null);
          }
        },
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
                    const isSelected = (i === 0 && activeAplica === 'SI') || (i === 1 && activeAplica === 'NO');
                    return {
                      text: `${label}: ${val} (${pct}%)${isSelected ? ' ✓' : ''}`,
                      fillStyle: baseAplicaColors[i],
                      strokeStyle: isSelected ? '#1e293b' : '#ffffff',
                      lineWidth: isSelected ? 2 : 1,
                      index: i
                    };
                  });
                }
                return [];
              }
            },
            onClick: (e, legendItem) => {
              handleAplicaFilter(legendItem.index === 0 ? 'SI' : 'NO');
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw || 0;
                const pct = totalAplica > 0 ? ((val / totalAplica) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${val} SKUs (${pct}%) - Clic para filtrar`;
              }
            }
          },
          datalabels: {
            display: (ctx) => {
              const val = ctx.dataset.data[ctx.dataIndex] || 0;
              return val > 0;
            },
            color: '#ffffff',
            font: { weight: 'bold', size: 13 },
            textStrokeColor: 'rgba(0,0,0,0.5)',
            textStrokeWidth: 2,
            formatter: (val) => val
          }
        }
      }
    });
  }

  // 4. Gráfico 3: Tendencia y Frecuencia de Restricciones Legales (Barra Horizontal Ancha filtrada por el estado seleccionado)
  const countRestricciones = {};
  const currentSKUs = new Set(enrichedRows.map(r => r.sku));
  
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
        labels: restrLabels.length > 0 ? restrLabels : ['Sin restricciones registradas para este filtro'],
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
