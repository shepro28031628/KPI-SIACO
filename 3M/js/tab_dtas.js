// ==========================================
// MÓDULO DTAS (PLANEACIÓN 2026)
// ==========================================
ChartManager.renderDTAS = function() {
  const rows = App.raw.dtas || [];
  
  // 1. KPIs Superiores
  const totalOps = rows.length;
  const avgVal = (arr) => {
    const valid = arr.filter(v => v !== null && typeof v === 'number' && !isNaN(v) && v >= 0);
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  };

  const avgG2 = avgVal(rows.map(r => r.dias_llegada_a_liberacion));
  const avgG3 = avgVal(rows.map(r => r.dias_llegada_a_ingresozf));
  const avgG4 = avgVal(rows.map(r => r.dias_ingresozf_a_levante));
  const avgG6 = avgVal(rows.map(r => r.dias_ingresozf_a_etiquetado));

  const elTotal = document.getElementById('valDtaTotalOps');
  const elAvgG2 = document.getElementById('valDtaAvgLlegadaLib');
  const elAvgG3 = document.getElementById('valDtaAvgLlegadaZF');
  const elAvgG4 = document.getElementById('valDtaAvgZfLevante');
  const elAvgG6 = document.getElementById('valDtaAvgZfEtiquetado');

  if (elTotal) elTotal.textContent = totalOps.toString();
  if (elAvgG2) elAvgG2.textContent = avgG2.toFixed(2).replace('.', ',') + ' d';
  if (elAvgG3) elAvgG3.textContent = avgG3.toFixed(2).replace('.', ',') + ' d';
  if (elAvgG4) elAvgG4.textContent = avgG4.toFixed(2).replace('.', ',') + ' d';
  if (elAvgG6) elAvgG6.textContent = avgG6.toFixed(2).replace('.', ',') + ' d';

  if (!rows.length) return;

  // Agrupar datos por Documento de Transporte para los análisis detallados
  const docGroups = {};
  rows.forEach(r => {
    const doc = r.documentodetransporte || 'SIN_DOC';
    if (!docGroups[doc]) {
      docGroups[doc] = {
        count: 0,
        g2: [],
        g3: [],
        g4: [],
        g6: []
      };
    }
    docGroups[doc].count++;
    if (r.dias_llegada_a_liberacion !== null && r.dias_llegada_a_liberacion >= 0) docGroups[doc].g2.push(r.dias_llegada_a_liberacion);
    if (r.dias_llegada_a_ingresozf !== null && r.dias_llegada_a_ingresozf >= 0) docGroups[doc].g3.push(r.dias_llegada_a_ingresozf);
    if (r.dias_ingresozf_a_levante !== null && r.dias_ingresozf_a_levante >= 0) docGroups[doc].g4.push(r.dias_ingresozf_a_levante);
    if (r.dias_ingresozf_a_etiquetado !== null && r.dias_ingresozf_a_etiquetado >= 0) docGroups[doc].g6.push(r.dias_ingresozf_a_etiquetado);
  });

  const docKeys = Object.keys(docGroups).sort((a, b) => docGroups[b].count - docGroups[a].count);
  const topDocs = docKeys.slice(0, 12); // Top 12 documentos de transporte

  const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Helper para calcular promedios mensuales
  const getMonthlyAvg = (field, dateField = 'fecharealdellegada') => {
    const sums = Array(12).fill(0);
    const counts = Array(12).fill(0);
    rows.forEach(r => {
      let d = r[dateField];
      if (!d) d = r.fecharealdellegada || r.fechaliberacion || r.fechaingresozf || r.fechadelevante;
      if (d instanceof Date && !isNaN(d)) {
        const m = d.getMonth();
        const v = r[field];
        if (v !== null && typeof v === 'number' && !isNaN(v) && v >= 0) {
          sums[m] += v;
          counts[m]++;
        }
      }
    });
    return sums.map((s, m) => counts[m] > 0 ? parseFloat((s / counts[m]).toFixed(1)) : 0);
  };

  // ==========================================
  // GRÁFICA 1: Planeación - Documentos de Transporte por Mes de Levante (Col D y Col O)
  // ==========================================
  destroyChart('chartDtaDocTrans');
  const elG1 = document.getElementById('chartDtaDocTrans');
  if (elG1 && typeof Chart !== 'undefined') {
    const monthlyDocs = Array(12).fill(0);
    const monthlyDOs = Array(12).fill(0);
    const docsByMonth = Array.from({ length: 12 }, () => new Set());
    rows.forEach(r => {
      const d = r.fechadelevante instanceof Date && !isNaN(r.fechadelevante) ? r.fechadelevante : null;
      if (d) {
        const m = d.getMonth();
        monthlyDOs[m]++;
        if (r.documentodetransporte) docsByMonth[m].add(r.documentodetransporte);
      }
    });

    for (let m = 0; m < 12; m++) {
      monthlyDocs[m] = docsByMonth[m].size;
    }

    App.charts.chartDtaDocTrans = new Chart(elG1, {
      type: 'bar',
      data: {
        labels: MONTHS_ES,
        datasets: [
          {
            label: 'Doc. Transporte (Col D)',
            data: monthlyDocs,
            backgroundColor: '#005ebb',
            borderRadius: 4
          },
          {
            label: 'Total DOs (Col C)',
            data: monthlyDOs,
            backgroundColor: '#0284c7',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 10 } },
        plugins: {
          legend: { 
            position: 'top', 
            align: 'end',
            labels: { boxWidth: 10, padding: 12, font: { size: 9.5, weight: '600' } } 
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: '#005ebb',
            font: { weight: 'bold', size: 9.5 },
            formatter: (v) => v > 0 ? v : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9.5 }, maxRotation: 0, minRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '30%' }
        }
      }
    });
  }

  // ==========================================
  // GRÁFICA 2: Fecha Real de Llegada (H) vs Liberación (J) por Mes
  // ==========================================
  destroyChart('chartDtaLlegadaLiberacion');
  const elG2 = document.getElementById('chartDtaLlegadaLiberacion');
  if (elG2 && typeof Chart !== 'undefined') {
    const dataG2 = getMonthlyAvg('dias_llegada_a_liberacion', 'fecharealdellegada');

    App.charts.chartDtaLlegadaLiberacion = new Chart(elG2, {
      type: 'bar',
      data: {
        labels: MONTHS_ES,
        datasets: [{
          label: 'Días Promedio (Liberación - Llegada)',
          data: dataG2,
          backgroundColor: '#0284c7',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 12 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: '#0284c7',
            font: { weight: 'bold', size: 9 },
            formatter: (v) => v > 0 ? v.toString().replace('.', ',') + ' d' : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9.5 }, maxRotation: 0, minRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '25%' }
        }
      }
    });
  }

  // ==========================================
  // GRÁFICA 3: Fecha Real de Llegada (H) vs Ingreso ZF (L) por Mes
  // ==========================================
  destroyChart('chartDtaLlegadaIngresoZF');
  const elG3 = document.getElementById('chartDtaLlegadaIngresoZF');
  if (elG3 && typeof Chart !== 'undefined') {
    const dataG3 = getMonthlyAvg('dias_llegada_a_ingresozf', 'fecharealdellegada');

    App.charts.chartDtaLlegadaIngresoZF = new Chart(elG3, {
      type: 'bar',
      data: {
        labels: MONTHS_ES,
        datasets: [{
          label: 'Días Promedio (Ingreso ZF - Llegada)',
          data: dataG3,
          backgroundColor: '#059669',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 12 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: '#059669',
            font: { weight: 'bold', size: 9 },
            formatter: (v) => v > 0 ? v.toString().replace('.', ',') + ' d' : ''
          }
        },
        scales: {
          x: { 
            grid: { display: false }, 
            ticks: { font: { size: 9.5 }, maxRotation: 0, minRotation: 0 } 
          },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '25%' }
        }
      }
    });
  }

  // ==========================================
  // GRÁFICA 4: Días en Zona Franca vs Levante (Col O - Col L) por Mes
  // ==========================================
  destroyChart('chartDtaZfLevante');
  const elG4 = document.getElementById('chartDtaZfLevante');
  if (elG4 && typeof Chart !== 'undefined') {
    const dataG4 = getMonthlyAvg('dias_ingresozf_a_levante', 'fechadelevante');

    App.charts.chartDtaZfLevante = new Chart(elG4, {
      type: 'bar',
      data: {
        labels: MONTHS_ES,
        datasets: [{
          label: 'Días Promedio (Levante - Ingreso ZF)',
          data: dataG4,
          backgroundColor: '#ea580c',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 12 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: '#ea580c',
            font: { weight: 'bold', size: 9 },
            formatter: (v) => v > 0 ? v.toString().replace('.', ',') + ' d' : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9.5 }, maxRotation: 0, minRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '25%' }
        }
      }
    });
  }

  // ==========================================
  // GRÁFICA 5: Días de Ingreso a Zona Franca vs Etiquetado (Col P - Col L) por Mes
  // ==========================================
  destroyChart('chartDtaIngresoEtiquetado');
  const elG5 = document.getElementById('chartDtaIngresoEtiquetado');
  if (elG5 && typeof Chart !== 'undefined') {
    const dataEtiquetado = getMonthlyAvg('dias_ingresozf_a_etiquetado', 'fechaingresozf');

    App.charts.chartDtaIngresoEtiquetado = new Chart(elG5, {
      type: 'bar',
      data: {
        labels: MONTHS_ES,
        datasets: [{
          label: 'Días Promedio (Ingreso ZF a Etiquetado)',
          data: dataEtiquetado,
          backgroundColor: '#7c3aed',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 12 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: '#7c3aed',
            font: { weight: 'bold', size: 9 },
            formatter: (v) => v > 0 ? v.toString().replace('.', ',') + ' d' : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9.5 }, maxRotation: 0, minRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '25%' }
        }
      }
    });
  }

  // ==========================================
  // GRÁFICA 6: Fecha Finalización Etiquetado (P) - Fecha Ingreso ZF (L) por Mes
  // ==========================================
  destroyChart('chartDtaFinalEtiquetadoZF');
  const elG6 = document.getElementById('chartDtaFinalEtiquetadoZF');
  if (elG6 && typeof Chart !== 'undefined') {
    const dataG6 = getMonthlyAvg('dias_ingresozf_a_etiquetado', 'fechafinalizacionetiquetado');

    App.charts.chartDtaFinalEtiquetadoZF = new Chart(elG6, {
      type: 'bar',
      data: {
        labels: MONTHS_ES,
        datasets: [{
          label: 'Días Etiquetado en ZF (Col P - Col L)',
          data: dataG6,
          backgroundColor: '#db2777',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 12 } },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: '#db2777',
            font: { weight: 'bold', size: 9 },
            formatter: (v) => v > 0 ? v.toString().replace('.', ',') + ' d' : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9.5 }, maxRotation: 0, minRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '25%' }
        }
      }
    });
  }

  // ==========================================
  // TABLA DETALLADA DE DTAS
  // ==========================================
  const tbody = document.getElementById('tbodyDtas');
  if (tbody) {
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const fmtD = (d) => (d instanceof Date && !isNaN(d)) ? fmtDateUTC(d) : '-';
      tr.innerHTML = `
        <td><strong>${r.do || '-'}</strong></td>
        <td>${r.documentodetransporte || '-'}</td>
        <td>${r.proveedor || '-'}</td>
        <td>${fmtD(r.fecharealdellegada)}</td>
        <td>${fmtD(r.fechaliberacion)}</td>
        <td>${fmtD(r.fechaingresozf)}</td>
        <td>${fmtD(r.fechadelevante)}</td>
        <td>${fmtD(r.fechafinalizacionetiquetado)}</td>
        <td><span class="badge ${r.dias_llegada_a_liberacion <= 5 ? 'badge-ok' : 'badge-warn'}">${r.dias_llegada_a_liberacion !== null ? r.dias_llegada_a_liberacion + ' d' : '-'}</span></td>
        <td><span class="badge ${r.dias_llegada_a_ingresozf <= 10 ? 'badge-ok' : 'badge-warn'}">${r.dias_llegada_a_ingresozf !== null ? r.dias_llegada_a_ingresozf + ' d' : '-'}</span></td>
        <td><span class="badge ${r.dias_ingresozf_a_levante <= 30 ? 'badge-ok' : 'badge-danger'}">${r.dias_ingresozf_a_levante !== null ? r.dias_ingresozf_a_levante + ' d' : '-'}</span></td>
        <td><span class="badge ${r.dias_ingresozf_a_etiquetado <= 25 ? 'badge-ok' : 'badge-danger'}">${r.dias_ingresozf_a_etiquetado !== null ? r.dias_ingresozf_a_etiquetado + ' d' : '-'}</span></td>
        <td><span class="badge badge-ok">${r.estado || 'PROCESADO'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }
};
