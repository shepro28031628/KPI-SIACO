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

          this.barChart('chartModo', countBy(rows, 'mododetransporte'), 'pie', (modoLabel) => {
            if (modoLabel) {
              if (App.filters.modo.size === 1 && App.filters.modo.has(modoLabel)) {
                App.filters.modo = new Set(uniqueSorted(App.raw.indicadores.map(r => r['mododetransporte'])));
              } else {
                App.filters.modo = new Set([modoLabel]);
              }
            } else {
              App.filters.modo = new Set(uniqueSorted(App.raw.indicadores.map(r => r['mododetransporte'])));
            }
            ChartManager.renderAll();
          });

          this.barChart('chartAdmin', countBy(rows, 'administracion'), 'bar', (adminLabel) => {
            if (adminLabel) {
              if (App.filters.admin.size === 1 && App.filters.admin.has(adminLabel)) {
                App.filters.admin = new Set(uniqueSorted(App.raw.indicadores.map(r => r['administracion'])));
              } else {
                App.filters.admin = new Set([adminLabel]);
              }
            } else {
              App.filters.admin = new Set(uniqueSorted(App.raw.indicadores.map(r => r['administracion'])));
            }
            ChartManager.renderAll();
          });

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

          // Renderizar tarjetas de Procesos por Empresa
          const empresaListEl = document.getElementById('empresaProcessList');
          const clearBtnEl = document.getElementById('clearEmpresaFilterBtn');

          if (empresaListEl) {
            const isValidEmpresa = (str) => {
              if (!str || typeof str !== 'string') return false;
              const u = str.toLowerCase();
              return !u.includes('días') && !u.includes('dias') && !u.includes('finalizac') && !u.includes('levante') && !u.includes('limite') && !u.includes('resultado');
            };

            const allAdmins = uniqueSorted(App.raw.indicadores.map(r => r['administracion'])).filter(isValidEmpresa);

            const fromVal = document.getElementById('dateFrom') ? document.getElementById('dateFrom').value : '';
            const toVal = document.getElementById('dateTo') ? document.getElementById('dateTo').value : '';
            const from = fromVal ? parseUTCDate(fromVal) : null;
            const to = toVal ? parseUTCDate(toVal) : null;

            const baseRows = App.raw.indicadores.filter(r => {
              if (App.filters.modo && App.filters.modo.size && !App.filters.modo.has(r['mododetransporte'])) return false;
              const d = r['fechaaperturado'];
              if (App.filters.year && App.filters.year.size) {
                const yrStr = (d instanceof Date && !isNaN(d)) ? d.getFullYear().toString() : '';
                if (!App.filters.year.has(yrStr)) return false;
              }
              if (from && d instanceof Date && d < from) return false;
              if (to && d instanceof Date && d >= new Date(to.getTime() + 86400000)) return false;
              return true;
            });

            const empresaCounts = countBy(baseRows, 'administracion');
            const isFiltered = App.filters.admin && App.filters.admin.size > 0 && App.filters.admin.size < allAdmins.length;

            if (clearBtnEl) {
              clearBtnEl.style.display = isFiltered ? 'inline-block' : 'none';
              clearBtnEl.onclick = () => {
                App.filters.admin = new Set(allAdmins);
                const chipContainer = document.getElementById('chipAdmin');
                if (chipContainer) {
                  chipContainer.querySelectorAll('.chip').forEach(c => c.classList.add('active'));
                }
                ChartManager.renderAll();
              };
            }

            empresaListEl.innerHTML = '';
            allAdmins.forEach(empresa => {
              const count = empresaCounts[empresa] || 0;

              const card = document.createElement('div');
              card.className = `empresa-card ${isFiltered && App.filters.admin.has(empresa) ? 'active' : ''}`;
              card.title = `${empresa}: ${count} procesos`;

              const nameSpan = document.createElement('span');
              nameSpan.className = 'empresa-name';
              nameSpan.textContent = empresa;

              const countBadge = document.createElement('span');
              countBadge.className = 'empresa-count-badge';
              countBadge.textContent = count;

              card.appendChild(nameSpan);
              card.appendChild(countBadge);

              card.addEventListener('click', () => {
                if (App.filters.admin.size === 1 && App.filters.admin.has(empresa)) {
                  App.filters.admin = new Set(allAdmins);
                  const chipContainer = document.getElementById('chipAdmin');
                  if (chipContainer) {
                    chipContainer.querySelectorAll('.chip').forEach(c => c.classList.add('active'));
                  }
                } else {
                  App.filters.admin = new Set([empresa]);
                  const chipContainer = document.getElementById('chipAdmin');
                  if (chipContainer) {
                    chipContainer.querySelectorAll('.chip').forEach(c => {
                      if (c.dataset.value === empresa) c.classList.add('active');
                      else c.classList.remove('active');
                    });
                  }
                }
                ChartManager.renderAll();
              });

              empresaListEl.appendChild(card);
            });
          }
        }



