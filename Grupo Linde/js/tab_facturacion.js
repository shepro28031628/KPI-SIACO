ChartManager.renderFacturacion = function() {

  this.renderModuloKPI({
    campoTiempo: 'tiempofacturacion', campoCumplimiento: 'cumplefacturacion', campoJustificacion: 'responsablefacturacion',
    campoCausal: 'justificacionfacturacion',
    campoFecha: 'fechadelevante',
    elTT: 'valTTFactura', elDT: 'valDTFactura', chartLinea: 'chartPromFactura', chartDona: 'chartCumpleFactura',
    chartJust: 'chartJustFactura', tblJust: 'tblJustFacturaBody', tblDetalle: null,
    columnasTabla: null,
    campoRazonMes: 'mes1', campoRazonJust: 'justificacionesfacturacion', mod: 'facturacion'
  });

  // Renderizar gráfico de Responsables (Col AG) y Moda Causal (Col AH) - Facturación
  const rows = FilterEngine.filteredIndicadores('fechadelevante');
  const nonCompliantRows = rows.filter(r => String(r.cumplefacturacion).toUpperCase() === 'NO');

  const respCausalMap = {};
  nonCompliantRows.forEach(r => {
    let resp = r.responsablefacturacion ? String(r.responsablefacturacion).trim() : 'SIN RESPONSABLE';
    let causal = r.causal1facturacion ? String(r.causal1facturacion).trim() : (r.justificacionfacturacion ? String(r.justificacionfacturacion).trim() : 'SIN CAUSAL');
    if (!resp) resp = 'SIN RESPONSABLE';
    if (!causal) causal = 'SIN CAUSAL';

    if (!respCausalMap[resp]) {
      respCausalMap[resp] = { total: 0, causals: {} };
    }
    respCausalMap[resp].total++;
    respCausalMap[resp].causals[causal] = (respCausalMap[resp].causals[causal] || 0) + 1;
  });

  const labels = [];
  const data = [];
  const modas = [];
  const modaCounts = [];

  Object.keys(respCausalMap).sort((a, b) => respCausalMap[b].total - respCausalMap[a].total).forEach(resp => {
    labels.push(resp);
    data.push(respCausalMap[resp].total);

    let topCausal = 'SIN CAUSAL';
    let maxCount = 0;
    for (const [c, count] of Object.entries(respCausalMap[resp].causals)) {
      if (count > maxCount) {
        maxCount = count;
        topCausal = c;
      }
    }
    modas.push(topCausal);
    modaCounts.push(maxCount);
  });

  const activeJust = App.chartFilters['facturacion'] ? App.chartFilters['facturacion'].justificacion : null;
  const bgColors = labels.map(l => {
    if (activeJust && String(l).toUpperCase() !== String(activeJust).toUpperCase()) {
      return '#cbd5e1';
    }
    return '#f97316'; // Orange theme for Facturación
  });

  destroyChart('chartModaFactura');
  const canvas = document.getElementById('chartModaFactura');
  if (canvas && typeof Chart !== 'undefined') {
    App.charts.chartModaFactura = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Incumplimientos Facturación',
          data: data,
          backgroundColor: bgColors,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: 320, left: 10, top: 10, bottom: 10 }
        },
        onClick: (e, activeElements) => {
          if (activeElements.length > 0) {
            const idx = activeElements[0].index;
            const respLabel = labels[idx];
            if (App.chartFilters['facturacion'].justificacion === respLabel) {
              App.chartFilters['facturacion'].justificacion = null;
            } else {
              App.chartFilters['facturacion'].justificacion = respLabel;
            }
            ChartManager.renderFacturacion();
          } else {
            if (App.chartFilters['facturacion'].justificacion) {
              App.chartFilters['facturacion'].justificacion = null;
              ChartManager.renderFacturacion();
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `Responsable (Col AG): ${items[0].label}`,
              label: (item) => `Total Casos: ${item.raw}`,
              afterLabel: (item) => {
                const idx = item.dataIndex;
                return `Moda Causal (Col AH): "${modas[idx]}" (${modaCounts[idx]} de ${item.raw} casos)`;
              }
            }
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'end',
            color: '#1e293b',
            font: { weight: '600', size: 11 },
            formatter: (value, ctx) => {
              const idx = ctx.dataIndex;
              const m = modas[idx];
              const shortModa = m.length > 55 ? m.substring(0, 52) + '...' : m;
              return `${value} | Moda: ${shortModa}`;
            }
          }
        },
        scales: {
          x: { beginAtZero: true, grace: '15%', grid: { color: 'rgba(0,0,0,0.05)' } },
          y: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 11 } } }
        }
      }
    });
  }
};
