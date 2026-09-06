// ==========================================
// MÓDULO COO (CERTIFICADO DE ORIGEN) - 3M
// ==========================================
ChartManager.renderCOO = function() {
  const _isNum = typeof isNum === 'function' ? isNum : (v => typeof v === 'number' && !isNaN(v));
  const _fmtUSD = typeof fmtUSD === 'function' ? fmtUSD : (n => '$' + Math.round(n || 0).toLocaleString('en-US'));
  const _fmtDateUTC = typeof fmtDateUTC === 'function' ? fmtDateUTC : (d => d instanceof Date ? d.toISOString().split('T')[0] : String(d || '-'));

  const allCooRows = (App.raw.coo || []).filter(r => r && r['mes'] !== null && r['mes'] !== undefined);

  if (!App._cooFilters) {
    App._cooFilters = { mes: new Set(), pais: new Set(), sub: new Set() };
  }

  const capitalize = (s) => (s && typeof s === 'string') ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : String(s || '');

  // 1. Opciones únicas
  const monthOrder = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const uniqueMes = [...new Set(allCooRows.map(r => (r['mes'] || '').toString().toLowerCase().trim()).filter(Boolean))].sort((a, b) => {
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });
  const uniquePais = [...new Set(allCooRows.map(r => r['paisdeorigen']).filter(Boolean))].sort();
  const uniqueSub = [...new Set(allCooRows.map(r => r['subpartida']).filter(Boolean))].sort();

  // 2. Renderizar listas de filtros con checkboxes
  const renderFilterList = (containerId, items, filterSet, formatFn = (x) => x) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    items.forEach(item => {
      const label = document.createElement('label');
      label.className = 'coo-filter-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = filterSet.has(item);
      cb.addEventListener('change', () => {
        if (cb.checked) filterSet.add(item);
        else filterSet.delete(item);
        ChartManager.renderCOO();
      });
      label.appendChild(cb);
      const span = document.createElement('span');
      span.textContent = ' ' + formatFn(item);
      label.appendChild(span);
      el.appendChild(label);
    });
  };

  renderFilterList('cooFilterMes', uniqueMes, App._cooFilters.mes, capitalize);
  renderFilterList('cooFilterPais', uniquePais, App._cooFilters.pais);
  renderFilterList('cooFilterSubpartida', uniqueSub, App._cooFilters.sub);

  // 3. Filtrar registros
  let rows = allCooRows;
  if (App._cooFilters.mes.size) {
    rows = rows.filter(r => App._cooFilters.mes.has((r['mes'] || '').toString().toLowerCase().trim()));
  }
  if (App._cooFilters.pais.size) {
    rows = rows.filter(r => App._cooFilters.pais.has(r['paisdeorigen']));
  }
  if (App._cooFilters.sub.size) {
    rows = rows.filter(r => App._cooFilters.sub.has(r['subpartida']));
  }

  // 4. KPIs
  const total = rows.reduce((acc, r) => acc + (_isNum(r['ahorroenusd']) ? Number(r['ahorroenusd']) : 0), 0);
  const elTotal = document.getElementById('valCOOTotal');
  if (elTotal) elTotal.textContent = _fmtUSD(total);

  // 5. Tabla de detalle
  const tblCOO = document.getElementById('tblDetalleCOOBody');
  if (tblCOO) {
    tblCOO.innerHTML = '';
    if (rows.length > 0) {
      const fragment = document.createDocumentFragment();
      const displayRows = rows.slice(0, 300); // Top 300 para rendimiento fluido
      displayRows.forEach(r => {
        const tr = document.createElement('tr');
        const mName = capitalize(r['mes'] || '-');
        const pais = r['paisdeorigen'] || '-';
        const sub = r['subpartida'] || '-';
        const ahorro = _fmtUSD(r['ahorroenusd'] || 0);
        tr.innerHTML = `<td>${mName}</td><td>${pais}</td><td>${sub}</td><td style="text-align:right; font-weight:600;">${ahorro}</td>`;
        fragment.appendChild(tr);
      });
      tblCOO.appendChild(fragment);
    } else {
      tblCOO.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-light); padding:16px;">No hay datos para los filtros seleccionados</td></tr>';
    }
  }

  const elTableTotal = document.getElementById('cooTableTotal');
  if (elTableTotal) {
    const countInfo = rows.length > 300 ? ` (${rows.length} registros - mostrando primeros 300)` : ` (${rows.length} registros)`;
    elTableTotal.innerHTML = `<span><strong>Total</strong>${countInfo}</span> <strong>${_fmtUSD(total)}</strong>`;
  }

  // 6. Mapa Mundial Interactivo (jsVectorMap)
  const ISO2_MAP = {
    'BR': 'BR', 'DE': 'DE', 'FR': 'FR', 'KR': 'KR', 'MX': 'MX', 'PL': 'PL', 'US': 'US',
    'CHINA': 'CN', 'CN': 'CN', 'COLOMBIA': 'CO', 'CO': 'CO', 'INDIA': 'IN', 'IN': 'IN',
    'JAPON': 'JP', 'JP': 'JP', 'CR': 'CR', 'EC': 'EC', 'CA': 'CA', 'SE': 'SE', 'AT': 'AT',
    'CH': 'CH', 'GB': 'GB', 'AR': 'AR', 'CZ': 'CZ', 'RS': 'RS', 'IT': 'IT', 'TW': 'TW',
    'TH': 'TH', 'CL': 'CL', 'PE': 'PE', 'ES': 'ES', 'SG': 'SG', 'VN': 'VN', 'PA': 'PA',
    'DK': 'DK', 'LK': 'LK', 'SK': 'SK', 'PT': 'PT', 'SI': 'SI'
  };

  const byPaisISO = {};
  const countByPais = {};

  rows.forEach(r => {
    const rawPais = String(r['paisdeorigen'] || '').toUpperCase().trim();
    const clean = rawPais.replace(/[^A-Z]/g, '');
    const iso = ISO2_MAP[clean] || (clean.length === 2 ? clean : null);
    if (iso) {
      const val = _isNum(r['ahorroenusd']) ? Number(r['ahorroenusd']) : 0;
      byPaisISO[iso] = (byPaisISO[iso] || 0) + val;
      countByPais[iso] = (countByPais[iso] || 0) + 1;
    }
  });

  const mapEl = document.getElementById('cooWorldMap');
  if (mapEl) {
    if (typeof jsVectorMap === 'undefined') {
      mapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-light);font-size:13px;">Cargando mapa interactivo...</div>';
      return;
    }

    if (App.worldMapInstance) {
      try { App.worldMapInstance.destroy(); } catch (e) { console.warn('Error destroying world map:', e); }
      App.worldMapInstance = null;
    }

    mapEl.innerHTML = '';
    const maxVal = Math.max(...Object.values(byPaisISO), 1);

    const buildMap = () => {
      try {
        App.worldMapInstance = new jsVectorMap({
          selector: '#cooWorldMap',
          map: 'world',
          backgroundColor: 'transparent',
          zoomButtons: true,
          zoomOnScroll: false,
          draggable: true,
          regionStyle: {
            initial: {
              fill: '#e2e8f0',
              stroke: '#94a3b8',
              strokeWidth: 0.4,
              fillOpacity: 1
            },
            hover: {
              fillOpacity: 0.85,
              cursor: 'pointer'
            }
          },
          series: {
            regions: [{
              attribute: 'fill',
              scale: ['#bbf7d0', '#15803d'],
              values: byPaisISO,
              min: 0,
              max: maxVal
            }]
          },
          onRegionTooltipShow(event, tooltip, code) {
            if (byPaisISO[code] !== undefined) {
              const ahorro = _fmtUSD(byPaisISO[code]);
              const ops = countByPais[code] || 0;
              tooltip.text(
                `<div style="font-weight:700;margin-bottom:2px;">${code}</div>` +
                `<div>Ahorro: <strong>${ahorro}</strong></div>` +
                `<div style="font-size:11px;color:#94a3b8;">Operaciones: ${ops}</div>`,
                true
              );
            } else {
              tooltip.text(`<strong>${code}</strong><br><span style="color:#94a3b8;">Sin ahorro registrado</span>`, true);
            }
          }
        });
      } catch (err) {
        console.warn('Map render error:', err);
        mapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-light);font-size:13px;">No fue posible inicializar el mapa vectorial.</div>';
      }
    };

    // jsVectorMap mide el tamaño de su contenedor de forma SÍNCRONA en el
    // momento de construirse, y usa esa primera medición como base para
    // todos los cálculos de escala/zoom futuros. Si en ese instante el
    // layout de la cuadrícula (.coo-layout) todavía no está confirmado por
    // el navegador, el contenedor mide 0x0, el mapa queda invisible sin
    // lanzar ningún error, y ni siquiera updateSize() lo repara después
    // (la escala base queda en 0 y las siguientes divisiones dan NaN). Por
    // eso esperamos a que el contenedor tenga un tamaño real antes de crear
    // el mapa, reintentando por unos frames como máximo.
    let attempts = 0;
    const waitForSize = () => {
      const hasSize = mapEl.offsetWidth > 0 && mapEl.offsetHeight > 0;
      if (hasSize || attempts >= 10) {
        buildMap();
      } else {
        attempts++;
        requestAnimationFrame(waitForSize);
      }
    };
    waitForSize();
  }
};
