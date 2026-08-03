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
    App.charts.chartRegistrosTiempoLine = new Chart(document.getElementById('chartRegistrosTiempoLine'), {
      type: 'line',
      data: {
        labels: monthOrder,
        datasets: [{ label: 'Promedio Tiempo Aprobación', data: timeSums.map((s, i) => timeCounts[i] ? parseFloat((s / timeCounts[i]).toFixed(2)) : null), borderColor: PALETTE[0], fill: false }]
      },
      options: { 
        responsive: true, maintainAspectRatio: false,
        onClick: (e, act) => handleMonthClick(e, act, App.charts.chartRegistrosTiempoLine),
        plugins: {
          datalabels: {
            color: '#333', anchor: 'end', align: 'bottom',
            formatter: v => v > 0 ? String(v).replace('.', ',') : ''
          }
        }
      }
    });
  }
  this.renderSubTable('tblDetalleRegistrosBody', fullyFilteredRows, ['sku', 'noregistro', 'vistobueno', 'estado']);
}



