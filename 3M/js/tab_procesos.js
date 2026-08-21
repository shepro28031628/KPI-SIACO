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

          // Filtros estrictos: NO tener en cuenta vacíos en Fecha de Levante ni en Fecha Real de Llegada
          const rowsValidos = rows.filter(r => 
            r.fechadelevante instanceof Date && !isNaN(r.fechadelevante) && r.fechadelevante.getFullYear() > 2000 &&
            r.fecharealdellegada instanceof Date && !isNaN(r.fecharealdellegada) && r.fecharealdellegada.getFullYear() > 2000 &&
            r.tiempolevantellegada !== null && typeof r.tiempolevantellegada === 'number' && !isNaN(r.tiempolevantellegada) &&
            r.tiempolevantellegada >= 0
          );
          
          const rowsAereo = rowsValidos.filter(r => String(r.mododetransporte || '').toUpperCase().includes('AEREO'));
          const rowsMaritimo = rowsValidos.filter(r => String(r.mododetransporte || '').toUpperCase().includes('MARIT'));
          const rowsZF = rowsValidos.filter(r => {
            const m = String(r.mododetransporte || '').toUpperCase();
            return m === 'ZF' || m.includes('FRANCA') || m.includes('ZONA');
          });

          // 1. Gráfico Aéreo: Azul Cielo (2025) vs Azul Marino Profundo (2026)
          const colorsAereo = { 2025: '#0284c7', 2026: '#0c4a6e' };
          this.renderLineChart('chartTiempoAereo', getLineDatasets(rowsAereo, years, 'tiempolevantellegada', 'fechadelevante', false, 1, null, colorsAereo));

          // 2. Gráfico Marítimo: Verde Esmeralda (2025) vs Verde Marino Oscuro (2026)
          const colorsMaritimo = { 2025: '#059669', 2026: '#064e3b' };
          this.renderLineChart('chartTiempoMaritimo', getLineDatasets(rowsMaritimo, years, 'tiempolevantellegada', 'fechadelevante', false, 1, null, colorsMaritimo));

          // 3. Gráfico Zona Franca: Ámbar Cálido (2025) vs Naranja Oscuro (2026)
          const colorsZF = { 2025: '#f59e0b', 2026: '#b45309' };
          this.renderLineChart('chartTiempoZF', getLineDatasets(rowsZF, years, 'tiempolevantellegada', 'fechadelevante', false, 1, null, colorsZF));
        };



