ChartManager.renderInspeccion = function() {

          this.renderModuloKPI({
            campoTiempo: 'tiempoinspeccion', campoCumplimiento: 'cumpleinspeccion', campoJustificacion: 'justificacioninspeccion',
            elTT: 'valTTInspeccion', elDT: 'valDTInspeccion', chartLinea: 'chartPromInspeccion', chartDona: 'chartCumpleInspeccion',
            chartJust: null, tblJust: null, tblDetalle: 'tblDetalleInspeccionBody',
            columnasTabla: ['do_b', 'id_operacion', 'num_doc_trans', 'cumpleinspeccion', 'tiempoinspeccion', 'justificacioninspeccion'],
            tblFilterField: 'cumpleinspeccion', tblFilterValue: 'SI',
            campoFecha: 'fechadelevante', campoRazonMes: null, campoRazonJust: null, mod: 'inspeccion', requiredField: 'detalleinspeccion',
            dtFilterField: 'detalleinspeccion', keepDonaBlanks: true, dtRequiresFechaLevante: true
          });
        }
        ChartManager.renderCOO = function() {
          const allCooRows = App.raw.coo || [];

          if (!App._cooFilters) {
            App._cooFilters = { mes: new Set(), pais: new Set(), importador: new Set(), proveedor: new Set(), nomcomercial: new Set(), acuerdo: new Set() };
          }

          // Rango de fechas global
          const dateFromVal = document.getElementById('dateFrom') ? document.getElementById('dateFrom').value : null;
          const dateToVal = document.getElementById('dateTo') ? document.getElementById('dateTo').value : null;
          const dFrom = dateFromVal ? new Date(dateFromVal + 'T00:00:00') : null;
          const dTo = dateToVal ? new Date(dateToVal + 'T23:59:59') : null;

          // Función para filtrar filas aplicando todos los criterios EXCEPTO la clave indicada (para cascada)
          const filterRowsExcept = (excludeKey) => {
            return allCooRows.filter(r => {
              if (dFrom && (!(r.fechalev instanceof Date) || isNaN(r.fechalev) || r.fechalev < dFrom)) return false;
              if (dTo && (!(r.fechalev instanceof Date) || isNaN(r.fechalev) || r.fechalev > dTo)) return false;

              if (App.filters && App.filters.year && App.filters.year.size) {
                if (r.fechalev instanceof Date && !isNaN(r.fechalev)) {
                  if (!App.filters.year.has(r.fechalev.getFullYear().toString())) return false;
                }
              }

              if (App.filters && App.filters.admin && App.filters.admin.size && r.importador) {
                const imp = r.importador.toLowerCase();
                let matchAdmin = false;
                for (let admin of App.filters.admin) {
                  if (imp.includes(admin.toLowerCase()) || admin.toLowerCase().includes(imp)) { matchAdmin = true; break; }
                }
                if (!matchAdmin) return false;
              }

              if (excludeKey !== 'mes' && App._cooFilters.mes.size && !App._cooFilters.mes.has(r['mes'])) return false;
              if (excludeKey !== 'pais' && App._cooFilters.pais.size && !App._cooFilters.pais.has(r['paisdeorigen'])) return false;
              if (excludeKey !== 'importador' && App._cooFilters.importador.size && !App._cooFilters.importador.has(r['importador'])) return false;
              if (excludeKey !== 'proveedor' && App._cooFilters.proveedor && App._cooFilters.proveedor.size && !App._cooFilters.proveedor.has(r['proveedor'])) return false;
              if (excludeKey !== 'nomcomercial' && App._cooFilters.nomcomercial && App._cooFilters.nomcomercial.size && !App._cooFilters.nomcomercial.has(r['nomcomercial'])) return false;
              if (excludeKey !== 'acuerdo' && App._cooFilters.acuerdo.size && !App._cooFilters.acuerdo.has(r['acuerdo'])) return false;

              return true;
            });
          };

          // 1. Renderizar lista fija de los 12 meses (indicando conteo o sin datos)
          const allMonths = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          const rowsForMes = filterRowsExcept('mes');
          const countsByMonth = {};
          allMonths.forEach(m => countsByMonth[m] = 0);
          rowsForMes.forEach(r => {
            if (r.mes && countsByMonth[r.mes] !== undefined) {
              if (r.acuerdo && r.acuerdo !== 'SIN ACUERDO' && r.acuerdo !== '') {
                countsByMonth[r.mes]++;
              }
            }
          });

          const renderMesFilterList = () => {
            const el = document.getElementById('cooFilterMes'); if (!el) return;
            el.innerHTML = '';
            allMonths.forEach(m => {
              const count = countsByMonth[m] || 0;
              const label = document.createElement('label');
              label.className = 'coo-filter-item';
              if (count === 0) label.style.opacity = '0.6';

              const cb = document.createElement('input');
              cb.type = 'checkbox';
              cb.checked = App._cooFilters.mes.has(m);
              cb.addEventListener('change', () => {
                if (cb.checked) App._cooFilters.mes.add(m); else App._cooFilters.mes.delete(m);
                ChartManager.renderCOO();
              });

              label.appendChild(cb);
              const textSpan = document.createElement('span');
              textSpan.textContent = count > 0 ? `${m} (${count})` : `${m} (0 - sin datos)`;
              label.appendChild(textSpan);
              el.appendChild(label);
            });
          };
          renderMesFilterList();

          // 2. Renderizar listas de filtros en cascada (dinámicas según los demás filtros)
          const renderCascadingFilterList = (containerId, filterKey, getRowValue) => {
            const el = document.getElementById(containerId); if (!el) return;
            el.innerHTML = '';

            const availableRows = filterRowsExcept(filterKey);
            const validRows = filterKey === 'acuerdo'
              ? availableRows.filter(r => r.acuerdo && r.acuerdo !== 'SIN ACUERDO' && r.acuerdo !== '')
              : availableRows;

            const items = [...new Set(validRows.map(getRowValue).filter(Boolean))].sort();

            items.forEach(item => {
              const label = document.createElement('label'); label.className = 'coo-filter-item';
              const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = App._cooFilters[filterKey].has(item);
              cb.addEventListener('change', () => {
                if (cb.checked) App._cooFilters[filterKey].add(item); else App._cooFilters[filterKey].delete(item);
                ChartManager.renderCOO();
              });
              label.appendChild(cb); label.appendChild(document.createTextNode(item));
              el.appendChild(label);
            });

            if (items.length === 0) {
              el.innerHTML = '<div style="font-size:11px; color:var(--text-light); font-style:italic; padding:4px;">(sin opciones)</div>';
            }
          };

          renderCascadingFilterList('cooFilterPais', 'pais', r => r.paisdeorigen);
          renderCascadingFilterList('cooFilterImportador', 'importador', r => r.importador);
          renderCascadingFilterList('cooFilterProveedor', 'proveedor', r => r.proveedor);
          renderCascadingFilterList('cooFilterNomComercial', 'nomcomercial', r => r.nomcomercial);
          renderCascadingFilterList('cooFilterAcuerdo', 'acuerdo', r => r.acuerdo);

          // 3. Filas finales filtradas por TODOS los criterios activos
          let finalRows = filterRowsExcept(null);
          finalRows = finalRows.filter(r => r.acuerdo && r.acuerdo !== 'SIN ACUERDO' && r.acuerdo !== '');

          const total = sum(finalRows.map(r => r['ahorroenusd']));
          if (document.getElementById('valCOOTotal')) document.getElementById('valCOOTotal').textContent = fmtUSD(total);

          const tblCOO = document.getElementById('tblDetalleCOOBody');
          if (tblCOO) {
            tblCOO.innerHTML = '';
            if (finalRows.length > 0) {
              const fragment = document.createDocumentFragment();
              finalRows.forEach(r => {
                const tr = document.createElement('tr');
                const fechaStr = r.fechalev instanceof Date ? fmtDateUTC(r.fechalev) : (r.mes ? r.mes.toUpperCase() : '-');
                tr.innerHTML = `<td>${fechaStr}</td><td>${r.importador || '-'}</td><td>${r.acuerdo || '-'}</td><td>${r.nomcomercial || '-'}</td><td style="text-align:right; font-weight:bold;">${fmtUSD(r.ahorroenusd || 0)}</td>`;
                fragment.appendChild(tr);
              });
              tblCOO.appendChild(fragment);
            } else { tblCOO.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay datos para los filtros seleccionados</td></tr>'; }
          }
          if (document.getElementById('cooTableTotal')) document.getElementById('cooTableTotal').innerHTML = `<strong>Total (${finalRows.length} registros)</strong> <strong>${fmtUSD(total)}</strong>`;

          const ISO2_MAP = {
            'BR': 'BR', 'DE': 'DE', 'FR': 'FR', 'KR': 'KR', 'MX': 'MX', 'PL': 'PL', 'US': 'US',
            'CHINA': 'CN', 'CN': 'CN', 'COLOMBIA': 'CO', 'CO': 'CO', 'INDIA': 'IN', 'IN': 'IN',
            'JAPON': 'JP', 'JP': 'JP', 'CR': 'CR', 'EC': 'EC', 'CA': 'CA', 'SE': 'SE', 'AT': 'AT',
            'CH': 'CH', 'GB': 'GB', 'AR': 'AR', 'CZ': 'CZ', 'RS': 'RS', 'IT': 'IT'
          };
          const byPaisISO = {};
          const countryCounts = {};
          finalRows.forEach(r => {
            const clean = String(r['paisdeorigen']).toUpperCase().replace(/[^A-Z]/g, '');
            const iso = ISO2_MAP[clean] || (clean.length === 2 ? clean : null);
            if (iso) {
              byPaisISO[iso] = (byPaisISO[iso] || 0) + (isNum(r['ahorroenusd']) ? r['ahorroenusd'] : 0);
              countryCounts[iso] = (countryCounts[iso] || 0) + 1;
            }
          });

          const mapEl = document.getElementById('cooWorldMap');
          if (mapEl && typeof jsVectorMap !== 'undefined') {
            if (App.worldMapInstance) {
              try { App.worldMapInstance.destroy(); } catch (e) {}
              App.worldMapInstance = null;
            }
            mapEl.innerHTML = '';
            const maxVal = Math.max(...Object.values(byPaisISO), 1);
            try {
              App.worldMapInstance = new jsVectorMap({
                selector: '#cooWorldMap', map: 'world', backgroundColor: 'transparent',
                zoomButtons: false, zoomOnScroll: false, draggable: false,
                regionStyle: { initial: { fill: '#dde4ec', stroke: '#b0bec5', strokeWidth: 0.4 } },
                series: { regions: [{ attribute: 'fill', scale: { low: '#a8d5ba', high: '#1b5e20' }, values: byPaisISO, min: 0, max: maxVal }] },
                onRegionTooltipShow(event, tooltip, code) {
                  if (byPaisISO[code] !== undefined) tooltip.text(`<strong>${code}</strong><br>Ahorro: ${fmtUSD(byPaisISO[code])}<br>Operaciones: ${countryCounts[code] || 0}`, true);
                }
              });
            } catch (e) { console.warn('Map render error', e); }
          }
        }






