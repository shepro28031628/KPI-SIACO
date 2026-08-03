ChartManager.renderProcesos = function() {

          const rows = FilterEngine.filteredIndicadores();
          const years = getYearsForRows(rows);
          const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

          const docDatasets = years.map((yr, idx) => {
            const data = Array(12).fill(0);
            rows.forEach(r => {
              const d = r['fechaaperturado'];
              if (d instanceof Date && !isNaN(d) && d.getFullYear() === yr) data[d.getMonth()]++;
            });
            let color = PALETTE[idx % PALETTE.length];
            if (yr === 2025) color = PALETTE[0];
            if (yr === 2026) color = PALETTE[1];
            return { label: yr.toString(), data: data, backgroundColor: color };
          });

          destroyChart('chartDocsMes');
          const chartDocsMesEl = document.getElementById('chartDocsMes');
          if (chartDocsMesEl && typeof Chart !== 'undefined') {
            App.charts.chartDocsMes = new Chart(chartDocsMesEl, {
              type: 'bar',
              data: { labels: MONTHS_ES, datasets: docDatasets },
              options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { boxWidth: 12, font: { size: 11 } } },
                  datalabels: {
                    display: true, color: '#ffffff', font: { weight: 'bold', size: 11 },
                    formatter: (value) => value > 0 ? value : ''
                  }
                },
                scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: 'rgba(0,0,0,0.05)' } } }
              }
            });
          }

          this.barChart('chartModo', countBy(rows, 'mododetransporte'), 'pie');
          this.barChart('chartAdmin', countBy(rows, 'administracion'), 'bar');
          this.barChart('chartLinea', countBy(rows, 'lineadenegocio'), 'bar');

          const avgVal = (campo) => {
            const vals = rows.map(r => r[campo]).filter(v => isNum(v) && numVal(v) >= 0);
            return vals.length ? vals.reduce((a, b) => a + numVal(b), 0) / vals.length : 0;
          };

          const elValAgilidad = document.getElementById('valTTAgilidadProc');
          const elValFactura = document.getElementById('valTTFacturaProc');
          if (elValAgilidad) elValAgilidad.textContent = avgVal('tiempoagilidad').toFixed(2).replace('.', ',');
          if (elValFactura) elValFactura.textContent = avgVal('tiempofacturacion').toFixed(2).replace('.', ',');

          this.renderLineChart('chartPromAgilidadProc', getLineDatasets(rows, years, 'tiempoagilidad', 'fechadelevante'));
          this.renderLineChart('chartPromFacturaProc', getLineDatasets(rows, years, 'tiempofacturacion', 'fechadelevante'));
          this.renderLineChart('chartPromInspeccionProc', getLineDatasets(rows, years, 'tiempoinspeccion', 'fechadelevante', false, 1, 'detalleinspeccion'));
        }



