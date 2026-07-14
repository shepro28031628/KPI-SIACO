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
          const allCooRows = App.raw.coo.filter(r => r['mes'] !== null && r['mes'] !== undefined);
          const uniqueMes = [...new Set(allCooRows.map(r => r['mes']).filter(Boolean))].sort((a, b) => {
            const m = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            return m.indexOf(a) - m.indexOf(b);
          });
          const uniquePais = [...new Set(allCooRows.map(r => r['paisdeorigen']).filter(Boolean))].sort();
          const uniqueSub = [...new Set(allCooRows.map(r => r['subpartida']).filter(Boolean))].sort();

          if (!App._cooFilters) App._cooFilters = { mes: new Set(), pais: new Set(), sub: new Set() };

          const renderFilterList = (containerId, items, filterSet) => {
            const el = document.getElementById(containerId); if (!el) return;
            el.innerHTML = '';
            items.forEach(item => {
              const label = document.createElement('label'); label.className = 'coo-filter-item';
              const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = filterSet.has(item);
              cb.addEventListener('change', () => {
                if (cb.checked) filterSet.add(item); else filterSet.delete(item);
                ChartManager.renderCOO();
              });
              label.appendChild(cb); label.appendChild(document.createTextNode(item));
              el.appendChild(label);
            });
          };
          renderFilterList('cooFilterMes', uniqueMes, App._cooFilters.mes);
          renderFilterList('cooFilterPais', uniquePais, App._cooFilters.pais);
          renderFilterList('cooFilterSubpartida', uniqueSub, App._cooFilters.sub);

          let rows = allCooRows;
          if (App._cooFilters.mes.size) rows = rows.filter(r => App._cooFilters.mes.has(r['mes']));
          if (App._cooFilters.pais.size) rows = rows.filter(r => App._cooFilters.pais.has(r['paisdeorigen']));
          if (App._cooFilters.sub.size) rows = rows.filter(r => App._cooFilters.sub.has(r['subpartida']));

          const total = sum(rows.map(r => r['ahorroenusd']));
          if (document.getElementById('valCOOTotal')) document.getElementById('valCOOTotal').textContent = fmtUSD(total);

          const tblCOO = document.getElementById('tblDetalleCOOBody');
          if (tblCOO) {
            tblCOO.innerHTML = '';
            if (rows.length > 0) {
              const fragment = document.createDocumentFragment();
              rows.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${r['mes'] || '-'}</td><td>${r['subpartida'] || '-'}</td><td style="text-align:right">${fmtUSD(r['ahorroenusd'] || 0)}</td>`;
                fragment.appendChild(tr);
              });
              tblCOO.appendChild(fragment);
            } else { tblCOO.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay datos</td></tr>'; }
          }
          if (document.getElementById('cooTableTotal')) document.getElementById('cooTableTotal').innerHTML = `<strong>Total</strong> <strong>${fmtUSD(total)}</strong>`;

          const ISO2_MAP = { 'BR': 'BR', 'DE': 'DE', 'FR': 'FR', 'KR': 'KR', 'MX': 'MX', 'PL': 'PL', 'US': 'US', 'CHINA': 'CN', 'CN': 'CN', 'COLOMBIA': 'CO', 'CO': 'CO', 'INDIA': 'IN', 'IN': 'IN', 'JAPON': 'JP', 'JP': 'JP' };
          const byPaisISO = {};
          rows.forEach(r => {
            const clean = String(r['paisdeorigen']).toUpperCase().replace(/[^A-Z]/g, '');
            const iso = ISO2_MAP[clean] || (clean.length === 2 ? clean : null);
            if (iso) byPaisISO[iso] = (byPaisISO[iso] || 0) + (isNum(r['ahorroenusd']) ? r['ahorroenusd'] : 0);
          });

          const mapEl = document.getElementById('cooWorldMap');
          if (mapEl && typeof jsVectorMap !== 'undefined') {
            if (App.worldMapInstance) { App.worldMapInstance.destroy(); App.worldMapInstance = null; }
            mapEl.innerHTML = '';
            try {
              App.worldMapInstance = new jsVectorMap({
                selector: '#cooWorldMap', map: 'world', backgroundColor: 'transparent',
                zoomButtons: false, zoomOnScroll: false, draggable: false,
                regionStyle: { initial: { fill: '#dde4ec', stroke: '#b0bec5', strokeWidth: 0.4 } },
                series: { regions: [{ attribute: 'fill', scale: { low: '#a8d5ba', high: '#1b5e20' }, values: byPaisISO, min: 0, max: Math.max(...Object.values(byPaisISO), 1) }] },
                onRegionTooltipShow(event, tooltip, code) {
                  if (byPaisISO[code] !== undefined) tooltip.text(`<strong>${code}</strong><br>Ahorro: ${fmtUSD(byPaisISO[code])}`, true);
                }
              });
            } catch (e) { console.warn('Map render error', e); }
          }
        }






