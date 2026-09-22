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
    // El padding derecho reserva espacio para el texto "N | Moda: ..." que
    // se dibuja junto a cada barra (datalabel). Un valor fijo (320px) asume
    // que el canvas siempre tiene ese ancho disponible, pero en el layout
    // de impresión este gráfico comparte una columna angosta (la mitad del
    // ancho de la página) con la torta de al lado, así que ese padding fijo
    // por sí solo ya dejaba casi sin espacio a las barras y a las
    // etiquetas del eje Y, cortando ambos textos. Se calcula como una
    // proporción del ancho real del contenedor en su lugar.
    const wrapWidth = canvas.closest('.chart-wrap') ? canvas.closest('.chart-wrap').clientWidth : canvas.clientWidth;
    const rightPadding = Math.max(80, Math.min(320, Math.round(wrapWidth * 0.32)));
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
          padding: { right: rightPadding, left: 10, top: 10, bottom: 10 }
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
              // El límite de caracteres del texto "Moda: ..." se ajusta al
              // espacio realmente reservado (rightPadding), no a un tope
              // fijo, para que siga siendo legible sin salirse del canvas
              // en el layout angosto de impresión.
              const maxLen = Math.max(15, Math.round(rightPadding / 5.8));
              const shortModa = m.length > maxLen ? m.substring(0, maxLen - 3) + '...' : m;
              return `${value} | Moda: ${shortModa}`;
            }
          }
        },
        scales: {
          x: { beginAtZero: true, grace: '15%', grid: { color: 'rgba(0,0,0,0.05)' } },
          y: {
            grid: { display: false },
            ticks: {
              font: { weight: 'bold', size: 11 },
              // Trunca las etiquetas del eje Y (nombres de responsable) a un
              // largo razonable en vez de dejar que Chart.js reserve todo el
              // ancho que pidan los nombres más largos: en un canvas angosto
              // (como el de esta columna en el layout de impresión) eso
              // dejaba casi sin espacio a las barras y el texto terminaba
              // cortado contra el borde izquierdo del panel.
              callback: function (value) {
                const label = this.getLabelForValue(value);
                return label.length > 16 ? label.substring(0, 14) + '…' : label;
              }
            }
          }
        }
      }
    });
  }
};
