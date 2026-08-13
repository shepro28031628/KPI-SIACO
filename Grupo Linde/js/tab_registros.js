ChartManager.renderRegistros = function() {
  const baseRows = App.raw.registros.filter(r => r['noregistro'] !== null && r['noregistro'] !== undefined);
  const monthOrder = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  if (!App.chartFilters) App.chartFilters = {};
  if (!App.chartFilters.registros) App.chartFilters.registros = { label: null, month: null };

  let donutFilteredRows = [...baseRows];
  
  if (App.filters && App.filters.year && App.filters.year.size) {
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    donutFilteredRows = donutFilteredRows.filter(r => {
      let mIdx = -1;
      const d = r['fechasolicitud'] || r['fechaaprobacion'];
      if (d instanceof Date && !isNaN(d)) mIdx = d.getMonth();
      return mIdx !== -1 && App.filters.year.has(monthNames[mIdx].charAt(0).toUpperCase() + monthNames[mIdx].slice(1));
    });
  }
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

  let lineFilteredRows = [...donutFilteredRows];
  if (App.chartFilters.registros.label) {
    lineFilteredRows = lineFilteredRows.filter(r => String(r['estado']).toUpperCase() === App.chartFilters.registros.label.toUpperCase());
  }

  let fullyFilteredRows = lineFilteredRows.filter(r => donutFilteredRows.includes(r));

  if (document.getElementById('valRegTiempo')) document.getElementById('valRegTiempo').textContent = avg(fullyFilteredRows.map(r => r['tiempo'])).toFixed(2).replace('.', ',');

  if (document.getElementById('valRegNoReg')) document.getElementById('valRegNoReg').textContent = fmtInt(fullyFilteredRows.length);

  this.barChart('chartRegistrosEstadoDona', countBy(donutFilteredRows, 'estado'), 'doughnut', (label) => {
    if (label && App.chartFilters.registros.label !== label) {
      App.chartFilters.registros.label = label;
    } else {
      App.chartFilters.registros.label = null;
    }
    this.renderRegistros();
  }, App.chartFilters.registros.label);


  const regByMonth = Array(12).fill(0);
  const timeSums = Array(12).fill(0), timeCounts = Array(12).fill(0);

  lineFilteredRows.forEach(r => {
    let mIdx = monthOrder.indexOf((r['mes'] || '').toString().toLowerCase().trim());
    if (mIdx === -1) {
      const d = r['fechasolicitud'] || r['fechaaprobacion'];
      if (d instanceof Date && !isNaN(d)) mIdx = d.getMonth();
    }
    if (mIdx !== -1) {
      regByMonth[mIdx]++;
    }
  });

  const vuceData = App.raw.vuceRegistros || [];
  if (vuceData.length > 1) {
    const isYearFiltered = App.filters && App.filters.year && App.filters.year.size > 0;

    for (let i = 1; i < vuceData.length; i++) {
      const row = vuceData[i];
      if (!row) continue;
      
      // Columna D (index 3) y Columna F (index 5)
      let valD = row[3];
      let valF = row[5];

      let fechaCreacionObj = null;
      if (valD instanceof Date) {
          fechaCreacionObj = valD;
      } else if (typeof valD === 'string') {
          const parts = valD.split('-');
          if (parts.length === 3) fechaCreacionObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
          else {
              const parsed = Date.parse(valD);
              if(!isNaN(parsed)) fechaCreacionObj = new Date(parsed);
          }
      } else if (typeof valD === 'number') {
          fechaCreacionObj = new Date(Math.round((valD - 25569) * 86400 * 1000));
      }

      let fechaRegistro = null;
      
      if (valF && typeof valF === 'string' && valF.includes('REG-')) {
        const match = valF.match(/-(\d{8})[A-Z]?$/);
        if (match) {
          const dateStr = match[1]; 
          const year = parseInt(dateStr.substring(0, 4), 10);
          const month = parseInt(dateStr.substring(4, 6), 10) - 1;
          const day = parseInt(dateStr.substring(6, 8), 10);
          fechaRegistro = new Date(year, month, day);
        }
      }
      
      if (!fechaRegistro || isNaN(fechaRegistro)) {
        if (valF instanceof Date) {
            fechaRegistro = valF;
        } else if (typeof valF === 'number') {
            fechaRegistro = new Date(Math.round((valF - 25569) * 86400 * 1000));
        } else if (typeof valF === 'string') {
            const parts = valF.split('-');
            if (parts.length === 3) fechaRegistro = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
            else {
                const parsed = Date.parse(valF);
                if(!isNaN(parsed)) fechaRegistro = new Date(parsed);
            }
        }
      }

      if (fechaCreacionObj && !isNaN(fechaCreacionObj) && fechaRegistro && !isNaN(fechaRegistro)) {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthName = monthNames[fechaCreacionObj.getMonth()];
        
        // En la pestaña registros, el filtro "year" de la interfaz en realidad almacena los Meses
        if (isYearFiltered && !App.filters.year.has(monthName)) continue;

        let t = 0;
        if (typeof getWorkingDays === 'function') {
            t = getWorkingDays(fechaCreacionObj, fechaRegistro);
        } else {
            const diffTime = Math.abs(fechaRegistro - fechaCreacionObj);
            t = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        }

        const mIdx = fechaCreacionObj.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
            timeSums[mIdx] += t;
            timeCounts[mIdx]++;
        }
      }
    }
  }

  const totalVuceTime = timeSums.reduce((acc, val) => acc + val, 0);
  const totalVuceCount = timeCounts.reduce((acc, val) => acc + val, 0);
  const avgVuce = totalVuceCount > 0 ? (totalVuceTime / totalVuceCount) : 0;
  if (document.getElementById('valRegTiempo')) {
    document.getElementById('valRegTiempo').textContent = avgVuce.toFixed(2).replace('.', ',');
  }

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
  this.renderSubTable('tblDetalleRegistrosBody', fullyFilteredRows, ['noregistro']);
}



