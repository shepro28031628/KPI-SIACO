ChartManager.renderAgilidad = function() {

  this.renderModuloKPI({
    campoTiempo: 'tiempoagilidad', campoCumplimiento: 'cumpleagilidad', campoJustificacion: 'responsableagilidad',
    campoCausal: 'justificacionagilidad',
    campoFecha: 'fechadelevante',
    elTT: 'valTTAgilidad', elDT: 'valDTAgilidad', chartLinea: 'chartPromAgilidad', chartDona: 'chartCumpleAgilidad',
    chartJust: 'chartJustAgilidad', tblJust: 'tblJustAgilidadBody', tblDetalle: null,
    columnasTabla: null,
    campoRazonMes: 'mes', campoRazonJust: 'justificacionesoperaciones', mod: 'agilidad'
  });

  // Renderizar gráfico de Responsables (Col T) y Moda Causal (Col U)
  const rows = FilterEngine.filteredIndicadores('fechadelevante');
  const nonCompliantRows = rows.filter(r => String(r.cumpleagilidad).toUpperCase() === 'NO');

  const respCausalMap = {};
  nonCompliantRows.forEach(r => {
    let resp = r.responsableagilidad ? String(r.responsableagilidad).trim() : 'SIN RESPONSABLE';
    let causal = r.causal1agilidad ? String(r.causal1agilidad).trim() : (r.justificacionagilidad ? String(r.justificacionagilidad).trim() : 'SIN CAUSAL');
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

  const activeJust = App.chartFilters['agilidad'] ? App.chartFilters['agilidad'].justificacion : null;
  const bgColors = labels.map(l => {
    if (activeJust && String(l).toUpperCase() !== String(activeJust).toUpperCase()) {
      return '#cbd5e1';
    }
    return '#0284c7';
  });

  destroyChart('chartModaAgilidad');
  const canvas = document.getElementById('chartModaAgilidad');
  if (canvas && typeof Chart !== 'undefined') {
    App.charts.chartModaAgilidad = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Incumplimientos',
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
            if (App.chartFilters['agilidad'].justificacion === respLabel) {
              App.chartFilters['agilidad'].justificacion = null;
            } else {
              App.chartFilters['agilidad'].justificacion = respLabel;
            }
            ChartManager.renderAgilidad();
          } else {
            if (App.chartFilters['agilidad'].justificacion) {
              App.chartFilters['agilidad'].justificacion = null;
              ChartManager.renderAgilidad();
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `Responsable (Col T): ${items[0].label}`,
              label: (item) => `Total Casos: ${item.raw}`,
              afterLabel: (item) => {
                const idx = item.dataIndex;
                return `Moda Causal (Col U): "${modas[idx]}" (${modaCounts[idx]} de ${item.raw} casos)`;
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
