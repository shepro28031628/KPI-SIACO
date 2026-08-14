ChartManager.renderRegistros = function() {
  const baseRows = App.raw.registros.filter(r => r['noregistro'] !== null && r['noregistro'] !== undefined);
  const monthOrder = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  if (!App.chartFilters) App.chartFilters = {};
  if (!App.chartFilters.registros) App.chartFilters.registros = { label: null, month: null };

  let donutFilteredRows = [...baseRows];
  if (App.chartFilters.registros.month) {
    donutFilteredRows = donutFilteredRows.filter(r => {
      let mIdx = monthOrder.indexOf((r['mes'] || '').toString().toLowerCase().trim());
      if (mIdx === -1) {
        const d = r['fechasolicitud'] || r['fechaaprobacion'];
        if (d instanceof Date && !isNaN(d)) mIdx = d.getMonth();
      }
      return mIdx !== -1 && monthOrder[mIdx] === App.chartFilters.registros.month.toLowerCase();
    });
  }

  let lineFilteredRows = [...baseRows];
  if (App.chartFilters.registros.label) {
    lineFilteredRows = lineFilteredRows.filter(r => String(r['estado']).toUpperCase() === App.chartFilters.registros.label.toUpperCase());
  }

  let fullyFilteredRows = lineFilteredRows.filter(r => donutFilteredRows.includes(r));

  if (document.getElementById('valRegTiempo')) document.getElementById('valRegTiempo').textContent = avg(fullyFilteredRows.map(r => r['tiempo'])).toFixed(2).replace('.', ',');
  if (document.getElementById('valRegSKU')) {
    const skuStrings = fullyFilteredRows.map(r => r['sku'] !== null && r['sku'] !== undefined ? String(r['sku']).trim() : '');
    document.getElementById('valRegSKU').textContent = fmtInt(uniqueSorted(skuStrings).length);
  }
  if (document.getElementById('valRegNoReg')) document.getElementById('valRegNoReg').textContent = fmtInt(fullyFilteredRows.length);

  this.barChart('chartRegistrosEstadoDona', countBy(donutFilteredRows, 'estado'), 'doughnut', (label) => {
    if (label && App.chartFilters.registros.label !== label) {
      App.chartFilters.registros.label = label;
    } else {
      App.chartFilters.registros.label = null;
    }
    this.renderRegistros();
  }, App.chartFilters.registros.label);

  const skuByMonthSets = Array.from({ length: 12 }, () => new Set());
  const regByMonth = Array(12).fill(0);
  const timeSums = Array(12).fill(0), timeCounts = Array(12).fill(0);

  lineFilteredRows.forEach(r => {
    let mIdx = monthOrder.indexOf((r['mes'] || '').toString().toLowerCase().trim());
    if (mIdx === -1) {
      const d = r['fechasolicitud'] || r['fechaaprobacion'];
      if (d instanceof Date && !isNaN(d)) mIdx = d.getMonth();
    }
    if (mIdx !== -1) {
      if (r['sku']) skuByMonthSets[mIdx].add(String(r['sku']).trim());
      regByMonth[mIdx]++;
      if (isNum(r['tiempo'])) { timeSums[mIdx] += r['tiempo']; timeCounts[mIdx]++; }
    }
  });

  const handleMonthClick = (e, activeElements, chart) => {
    if (activeElements.length > 0) {
      const index = activeElements[0].index;
      const monthLabel = chart.data.labels[index];
      if (App.chartFilters.registros.month !== monthLabel) {
        App.chartFilters.registros.month = monthLabel;
      } else {
        App.chartFilters.registros.month = null;
      }
      this.renderRegistros();
    }
  };

  destroyChart('chartRegistrosMesBar');
  if (document.getElementById('chartRegistrosMesBar') && typeof Chart !== 'undefined') {
    App.charts.chartRegistrosMesBar = new Chart(document.getElementById('chartRegistrosMesBar'), {
      type: 'bar',
      data: {
        labels: monthOrder,
        datasets: [
          { label: 'SKU', data: skuByMonthSets.map(s => s.size), backgroundColor: PALETTE[0] },
          { label: 'No. REGISTRO', data: regByMonth, type: 'line', borderColor: PALETTE[2], fill: false }
        ]
      },
      options: { 
        responsive: true, maintainAspectRatio: false,
        onClick: (e, act) => handleMonthClick(e, act, App.charts.chartRegistrosMesBar),
        plugins: {
          datalabels: {
            color: '#333', anchor: 'end', align: 'end',
            formatter: v => v > 0 ? v : ''
          }
        }
      }
    });
  }

  destroyChart('chartRegistrosTiempoLine');
  if (document.getElementById('chartRegistrosTiempoLine') && typeof Chart !== 'undefined') {
    const ctxCanvas = document.getElementById('chartRegistrosTiempoLine').getContext('2d');
    let gradient = null;
    if (ctxCanvas) {
      gradient = ctxCanvas.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0.01)');
    }

    const monthLabelsFormatted = monthOrder.map(m => m.charAt(0).toUpperCase() + m.slice(1));
    const timeData = timeSums.map((s, i) => timeCounts[i] ? parseFloat((s / timeCounts[i]).toFixed(2)) : null);

    App.charts.chartRegistrosTiempoLine = new Chart(document.getElementById('chartRegistrosTiempoLine'), {
      type: 'line',
      data: {
        labels: monthLabelsFormatted,
        datasets: [{
          label: 'Promedio Tiempo Aprobación (días)',
          data: timeData,
          borderColor: '#0284c7',
          backgroundColor: gradient || 'rgba(14, 165, 233, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 9,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#0284c7',
          pointBorderWidth: 3,
          spanGaps: true
        }]
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        onClick: (e, act) => handleMonthClick(e, act, App.charts.chartRegistrosTiempoLine),
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { boxWidth: 12, font: { weight: '600', size: 12 } }
          },
          datalabels: {
            display: true,
            align: 'top',
            anchor: 'end',
            offset: 6,
            color: '#0f172a',
            font: { weight: 'bold', size: 11 },
            formatter: v => (v !== null && v > 0) ? `${v.toFixed(1).replace('.', ',')} d` : ''
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { weight: '600', size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.06)' },
            ticks: {
              callback: v => v + ' d'
            }
          }
        }
      }
    });
  }
}



