ChartManager.renderRegistros = function() {

          const rows = App.raw.registros.filter(r => r['noregistro'] !== null && r['noregistro'] !== undefined);
          if (document.getElementById('valRegTiempo')) document.getElementById('valRegTiempo').textContent = avg(rows.map(r => r['tiempo'])).toFixed(2).replace('.', ',');
          if (document.getElementById('valRegSKU')) {
            const skuStrings = rows.map(r => r['sku'] !== null && r['sku'] !== undefined ? String(r['sku']).trim() : '');
            document.getElementById('valRegSKU').textContent = fmtInt(uniqueSorted(skuStrings).length);
          }
          if (document.getElementById('valRegNoReg')) document.getElementById('valRegNoReg').textContent = fmtInt(rows.length);

          this.barChart('chartRegistrosEstadoDona', countBy(rows, 'estado'), 'doughnut');

          const monthOrder = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          const skuByMonthSets = Array.from({ length: 12 }, () => new Set());
          const regByMonth = Array(12).fill(0);
          const timeSums = Array(12).fill(0), timeCounts = Array(12).fill(0);

          rows.forEach(r => {
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

          destroyChart('chartRegistrosMesBar');
          if (document.getElementById('chartRegistrosMesBar') && typeof Chart !== 'undefined') {
            App.charts.chartRegistrosMesBar = new Chart(document.getElementById('chartRegistrosMesBar'), {
              type: 'bar',
              data: {
                labels: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                datasets: [
                  { label: 'SKU', data: skuByMonthSets.map(s => s.size), backgroundColor: '#1E90FF' },
                  { label: 'No. REGISTRO', data: regByMonth, type: 'line', borderColor: '#FF7F50', fill: false }
                ]
              },
              options: { 
                responsive: true, maintainAspectRatio: false,
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
                labels: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                datasets: [{ label: 'Promedio Tiempo Aprobación', data: timeSums.map((s, i) => timeCounts[i] ? parseFloat((s / timeCounts[i]).toFixed(2)) : null), borderColor: '#1E90FF', fill: false }]
              },
              options: { 
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  datalabels: {
                    color: '#333', anchor: 'end', align: 'bottom',
                    formatter: v => v > 0 ? String(v).replace('.', ',') : ''
                  }
                }
              }
            });
          }
          this.renderSubTable('tblDetalleRegistrosBody', rows, ['sku', 'noregistro', 'vistobueno', 'estado']);
        }



