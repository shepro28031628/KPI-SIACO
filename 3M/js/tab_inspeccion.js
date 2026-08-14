// ==========================================
// MÓDULO INSPECCIÓN
// ==========================================
ChartManager.renderInspeccion = function() {
  const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Obtener filas según filtros globales
  const rows = FilterEngine.filteredIndicadores();

  // Filtrar operaciones que tuvieron inspección
  const inspRows = rows.filter(r => (r.cumpleinspeccion === 'SI' || (r.tiempoinspeccion !== null && r.tiempoinspeccion > 0)) && r.fechadelevante);

  // 1. Tarjetas KPI
  const avgTiempo = inspRows.length > 0 ? (inspRows.reduce((a, b) => a + (b.tiempoinspeccion || 0), 0) / inspRows.length) : 0;
  const totalDT = inspRows.length;

  const elTT = document.getElementById('valTTInspeccion');
  if (elTT) elTT.textContent = avgTiempo.toFixed(2).replace('.', ',');

  const elDT = document.getElementById('valDTInspeccion');
  if (elDT) elDT.textContent = totalDT.toString();

  // 2. Gráfico 1: Promedio de Tiempo Inspección por Mes
  const elProm = document.getElementById('chartPromInspeccion');
  if (elProm && typeof Chart !== 'undefined') {
    destroyChart('chartPromInspeccion');

    // Agrupar por mes y año
    const monthlySum2025 = Array(12).fill(0);
    const monthlyCount2025 = Array(12).fill(0);
    const monthlySum2026 = Array(12).fill(0);
    const monthlyCount2026 = Array(12).fill(0);

    inspRows.forEach(r => {
      const d = r.fechadelevante instanceof Date ? r.fechadelevante : parseExcelDateSafe(r.fechadelevante);
      if (d instanceof Date && !isNaN(d)) {
        const m = d.getMonth();
        const y = d.getFullYear();
        const t = typeof r.tiempoinspeccion === 'number' ? r.tiempoinspeccion : parseFloat(r.tiempoinspeccion) || 0;
        if (y === 2025) {
          monthlySum2025[m] += t;
          monthlyCount2025[m]++;
        } else if (y === 2026) {
          monthlySum2026[m] += t;
          monthlyCount2026[m]++;
        }
      }
    });

    const data2025 = monthlySum2025.map((s, i) => monthlyCount2025[i] > 0 ? parseFloat((s / monthlyCount2025[i]).toFixed(2)) : null);
    const data2026 = monthlySum2026.map((s, i) => monthlyCount2026[i] > 0 ? parseFloat((s / monthlyCount2026[i]).toFixed(2)) : null);

    const has2025 = data2025.some(v => v !== null);
    const datasets = [];

    if (has2025) {
      datasets.push({
        label: '2025',
        data: data2025,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        tension: 0.35,
        spanGaps: true,
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#0284c7',
        fill: false
      });
    }

    datasets.push({
      label: '2026',
      data: data2026,
      borderColor: '#005ebb',
      backgroundColor: 'rgba(0, 94, 187, 0.12)',
      tension: 0.35,
      spanGaps: true,
      borderWidth: 3,
      pointRadius: 6,
      pointBackgroundColor: '#005ebb',
      fill: true
    });

    App.charts.chartPromInspeccion = new Chart(elProm, {
      type: 'line',
      data: {
        labels: MONTHS_ES,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20, right: 15, left: 10, bottom: 5 } },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { boxWidth: 12, padding: 12, font: { size: 10.5, weight: '600' } }
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 4,
            color: '#005ebb',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            borderRadius: 4,
            padding: { top: 2, bottom: 2, left: 5, right: 5 },
            font: { weight: 'bold', size: 9.5 },
            formatter: (v) => v !== null && v > 0 ? v.toFixed(2).replace('.', ',') + ' d' : ''
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0, minRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '30%' }
        }
      }
    });
  }

  // 3. Gráfico 2: DT Inspecciones (Dona con valores claros y legibles)
  const elDona = document.getElementById('chartCumpleInspeccion');
  if (elDona && typeof Chart !== 'undefined') {
    destroyChart('chartCumpleInspeccion');

    const totalOps = rows.length;
    const conInsp = totalDT;
    const sinInsp = Math.max(0, totalOps - conInsp);

    App.charts.chartCumpleInspeccion = new Chart(elDona, {
      type: 'doughnut',
      data: {
        labels: ['Con Inspección', 'Sin Inspección'],
        datasets: [{
          data: [conInsp, sinInsp],
          backgroundColor: ['#005ebb', '#38bdf8'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 14, font: { size: 10, weight: '600' } }
          },
          datalabels: {
            display: true,
            color: '#ffffff',
            font: { weight: 'bold', size: 10 },
            formatter: (v, ctx) => {
              const sumTotal = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = sumTotal > 0 ? ((v / sumTotal) * 100).toFixed(1).replace('.', ',') + '%' : '';
              return v > 0 ? `${v}\n(${pct})` : '';
            }
          }
        },
        cutout: '58%'
      }
    });
  }
};
