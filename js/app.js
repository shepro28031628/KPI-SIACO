// ---------- Global State ----------
const App = {
  raw: { indicadores: [], coo: [], registros: [], razones: [] },
  charts: {},
  filters: { admin: new Set(), linea: new Set(), modo: new Set(), year: new Set(), from: null, to: null },
  tableState: { activeSheet: 'indicadores', searchQuery: '', currentPage: 1, pageSize: 10 },
  worldMapInstance: null
};

const PALETTE = [
  '#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7',
  '#744EC2', '#D9B300', '#D64550', '#197278', '#1AAB40',
  '#15C6F4', '#4092FF', '#894EE6', '#C7519C', '#D65C4F',
  '#8B9B25', '#249C6B', '#1AA390', '#F9BB3C', '#E46C18'
];

if (typeof Chart !== 'undefined') {
  Chart.register(ChartDataLabels);
  Chart.defaults.color = '#605e5c';
  Chart.defaults.font.family = "'Segoe UI', 'Inter', sans-serif";
  Chart.defaults.borderColor = '#edebe9';
  Chart.defaults.plugins.datalabels = { display: false };
}

const els = {
  uploadZone: document.getElementById('uploadZone'),
  fileInput: document.getElementById('fileInput'),
  fileBtn: document.getElementById('fileBtn'),
  uploadStatus: document.getElementById('uploadStatus'),
  uploadError: document.getElementById('uploadError'),
  fileNameLabel: document.getElementById('fileNameLabel'),
  resetBtn: document.getElementById('resetBtn'),
  dashboard: document.getElementById('dashboard'),
  themeToggle: document.getElementById('themeToggle'),
  printBtn: document.getElementById('printReportBtn')
};

function showError(msg) {
  if (els.uploadError) {
    els.uploadError.textContent = msg;
    els.uploadError.style.display = 'block';
  }
  if (els.uploadStatus) {
    els.uploadStatus.style.display = 'none';
  }
}

function showNotification(message, type = 'info') {
  const toast = document.getElementById('customToast');
  const msgSpan = document.getElementById('toastMessage');
  const iconSpan = document.getElementById('toastIcon');
  if (!toast) return;

  msgSpan.textContent = message;
  iconSpan.textContent = type === 'error' ? '?' : (type === 'success' ? '?' : '??');

  toast.style.display = 'flex';
  toast.style.backgroundColor = type === 'error' ? '#a80000' : (type === 'success' ? '#107c41' : '#252423');

  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

const LocalDB = {
  dbName: 'torreControlDB',
  storeName: 'sessionStore',
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async save(key, data) {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(data, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) { console.error('IndexedDB save error', e); }
  },
  async load(key) {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) { console.error('IndexedDB load error', e); return null; }
  },
  async clear() {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) { console.error('IndexedDB clear error', e); }
  }
};

function getHolidaysSet() {
  const holidays = [
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18', '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20', '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08', '2025-12-25',
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25'
  ];
  const set = new Set();
  holidays.forEach(h => {
    const parts = h.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    set.add(d.getTime());
  });
  return set;
}

let holidaysSet = getHolidaysSet();

function getWorkingDays(start, end) {
  if (!(start instanceof Date) || isNaN(start)) return 0;
  if (!(end instanceof Date) || isNaN(end)) return 0;
  let d1 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const d2 = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (d1 > d2) return 0;
  let workingDays = 0;
  while (d1 <= d2) {
    const dayOfWeek = d1.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const isHoliday = holidaysSet.has(d1.getTime());
    if (!isWeekend && !isHoliday) workingDays++;
    d1.setDate(d1.getDate() + 1);
  }
  return workingDays;
}

function resolveSheetName(wb, name) {
  const target = name.toLowerCase().trim();
  return wb.SheetNames.find(sn => sn.toLowerCase().trim() === target) || null;
}

function safeSheet(wb, name) {
  const actual = resolveSheetName(wb, name);
  if (!actual) return [];
  const opts = { defval: null, raw: true };
  if (name === 'festivos') opts.header = ['fecha'];
  return XLSX.utils.sheet_to_json(wb.Sheets[actual], opts);
}

function findMainTable(doc) {
  const tables = doc.querySelectorAll('table');
  for (let table of tables) {
    const text = table.textContent.toUpperCase();
    if (text.includes('FECHA DE CREACION DEL DO') && text.includes('DO') && text.includes('MODO DE TRANSPORTE')) return table;
  }
  return null;
}

function parseNestedTable(cell) {
  if (!cell) return { tiempo: null, cumple: null, responsable: null, justificacion: null };
  const innerTable = cell.querySelector('table');
  if (!innerTable) return { tiempo: null, cumple: null, responsable: null, justificacion: null };
  const rows = Array.from(innerTable.querySelectorAll('tr'));
  if (rows.length === 0) return { tiempo: null, cumple: null, responsable: null, justificacion: null };

  const headerRow = rows[0];
  const headers = Array.from(headerRow.querySelectorAll('td, th')).map(td => td.textContent.toLowerCase().trim());
  const indicesObtenido = [];
  headers.forEach((h, idx) => { if (h.includes('resultado obtenido')) indicesObtenido.push(idx); });

  const idxCumple = headers.indexOf('cumple') !== -1 ? headers.indexOf('cumple') : 7;
  const idxDetalle = headers.indexOf('detalle de incumplimiento') !== -1 ? headers.indexOf('detalle de incumplimiento') : 8;
  const idxResp = headers.indexOf('responsable_1') !== -1 ? headers.indexOf('responsable_1') : 9;

  const dataRow = rows[rows.length - 1];
  if (!dataRow) return { tiempo: null, cumple: null, responsable: null, justificacion: null };
  const cells = Array.from(dataRow.querySelectorAll('td'));
  if (cells.length === 0) return { tiempo: null, cumple: null, responsable: null, justificacion: null };

  const txt = (idx) => cells[idx] ? cells[idx].textContent.trim() : null;
  let score = null;
  if (indicesObtenido.length > 0) {
    for (let idx of indicesObtenido) {
      const valStr = txt(idx);
      if (valStr && valStr.includes(',')) {
        score = parseFloat(valStr.replace(',', '.'));
        break;
      }
    }
    if (score === null && indicesObtenido[1] !== undefined) score = parseFloat(txt(indicesObtenido[1]).replace(',', '.'));
    if (isNaN(score) && indicesObtenido[0] !== undefined) score = parseFloat(txt(indicesObtenido[0]).replace(',', '.'));
  } else {
    score = parseFloat(txt(5).replace(',', '.'));
  }

  return {
    tiempo: isNaN(score) ? null : score,
    cumple: txt(idxCumple) || txt(7) || null,
    responsable: txt(idxDetalle) || txt(8) || null,
    justificacion: txt(idxResp) || txt(9) || null
  };
}

function formatModoTransporte(val) {
  if (typeof val !== 'string') return val;
  return /^NO\s*APLI[CZ]A$/i.test(val.trim()) ? 'ZF' : val;
}

function parseReporteHTML(htmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlStr, 'text/html');
  const mainTable = findMainTable(doc);
  if (!mainTable) return [];

  const mainRows = Array.from(mainTable.querySelectorAll(':scope > tbody > tr, :scope > tr'));
  const out = [];
  let startIdx = 1;
  if (mainRows[0] && mainRows[0].textContent.includes('FECHA DE CREACION DEL DO')) startIdx = 1;

  for (let i = startIdx; i < mainRows.length; i++) {
    const row = mainRows[i];
    const cells = Array.from(row.querySelectorAll(':scope > td'));
    if (cells.length < 9) continue;
    const text = (cell) => cell ? cell.textContent.trim().replace(/\s+/g, ' ') : null;

    const rec = {
      fechaaperturado: parseExcelDateSafe(text(cells[0])),
      do: text(cells[1]),
      do3m: text(cells[2]),
      documentodetransporte: text(cells[3]),
      mododetransporte: formatModoTransporte(text(cells[4])),
      administracion: text(cells[5]),
      lineadenegocio: text(cells[6]),
      tipodedeclaracion: text(cells[7]),
      fechadelevante: parseExcelDateSafe(text(cells[8]))
    };

    if (!rec.do && !rec.fechaaperturado) continue;
    if (rec.tipodedeclaracion && typeof rec.tipodedeclaracion === 'string') {
      const tipo = rec.tipodedeclaracion.toUpperCase();
      if (tipo.includes('LEGALIZACION') || tipo.includes('CORREC')) continue;
    }

    const agilidad = parseNestedTable(cells[9]);
    rec.tiempoagilidad = agilidad.tiempo;
    rec.cumpleagilidad = agilidad.cumple;
    rec.justificacionagilidad = agilidad.justificacion;
    rec.responsableagilidad = agilidad.responsable;
    rec.causal1agilidad = agilidad.causal;

    const inspeccion = parseNestedTable(cells[10]);
    rec.tiempoinspeccion = inspeccion.tiempo;
    rec.cumpleinspeccion = inspeccion.cumple;
    rec.justificacioninspeccion = inspeccion.justificacion;
    rec.responsableinspeccion = inspeccion.responsable;
    rec.causal1inspeccion = inspeccion.causal;

    const facturacion = parseNestedTable(cells[11]);
    rec.tiempofacturacion = facturacion.tiempo;
    rec.cumplefacturacion = facturacion.cumple;
    rec.justificacionfacturacion = facturacion.justificacion;
    rec.responsablefacturacion = facturacion.responsable;
    rec.causal1facturacion = facturacion.causal;

    out.push(rec);
  }
  return out;
}

function extractRazones(htmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlStr, 'text/html');
  const list = [];
  const tables = doc.querySelectorAll('table');
  for (let table of tables) {
    const text = table.textContent.toLowerCase();
    if (text.includes('justificaciones operaciones') || text.includes('justificaciones facturacion')) {
      const rows = Array.from(table.querySelectorAll('tr'));
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        if (cells.length >= 3) {
          const num = cells[0].textContent.trim();
          const mesVal = cells[1].textContent.trim();
          const just = cells[2].textContent.trim();
          if (just && just !== "" && !just.includes('Justificaciones')) {
            list.push({
              no: parseInt(num) || i,
              mes: mesVal,
              justificacionesoperaciones: just,
              justificacionesfacturacion: cells[6] ? cells[6].textContent.trim() : null,
              mes1: cells[5] ? cells[5].textContent.trim() : null
            });
          }
        }
      }
    }
  }
  return list;
}

function parseTSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split('\t').map(h => h.trim().replace(/"/g, ''));
  const list = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t');
    const row = {};
    headers.forEach((h, idx) => {
      let val = cols[idx] !== undefined ? cols[idx].trim().replace(/"/g, '') : null;
      row[h] = val;
    });
    list.push(row);
  }
  return list;
}

function parseIndicadoresGrouped(wb) {
  let actual = resolveSheetName(wb, 'Indicadores');
  if (!actual && wb.SheetNames.length > 0) actual = wb.SheetNames[0];
  if (!actual) return [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[actual], { header: 1, defval: null, raw: true });
  if (rows.length < 2) return [];

  // Determine if we need to skip a header row
  // Usually the first row is headers. We'll skip it.
  const dataRows = rows.slice(1);

  return dataRows.map((r, idx) => {
    // If the row doesn't have at least the minimum columns, return empty to be filtered
    if (!r || r.length < 9) return null;

    const out = {};

    // Helper for robust parsing of dates
    const getDate = (idx) => parseExcelDateSafe(r[idx]);
    // Helper for robust string parsing
    const getStr = (idx) => (r[idx] !== null && r[idx] !== undefined) ? String(r[idx]).trim() : null;
    // Helper for robust numeric parsing
    const getNum = (idx) => {
      if (r[idx] === null || r[idx] === undefined || String(r[idx]).trim() === '') return null;
      let strVal = String(r[idx]).trim();
      // Handle Spanish decimals by replacing comma with dot
      if (strVal.includes(',') && !strVal.includes('.')) {
        strVal = strVal.replace(',', '.');
      } else if (strVal.includes(',') && strVal.includes('.')) {
        // If it has both, like 1.000,50 -> remove dots, replace comma
        strVal = strVal.replace(/\./g, '').replace(',', '.');
      }
      const parsed = parseFloat(strVal);
      return isNaN(parsed) ? null : parsed;
    };

    // --- EXTRACT EXACT COLUMNS BASED ON USER REQUIREMENTS ---
    // PROCESOS: "fecha de creación" -> fallback to index 3 (Col D) or try to find it. But we'll assume index 3 or index 0 for now.
    out.fechaaperturado = getDate(0) || getDate(3);

    // BASE: Fecha de levante = Columna I (index 8)
    out.fechadelevante = getDate(8);

    // AGILIDAD
    out.tiempoagilidad = getNum(14); // Col O
    out.cumpleagilidad = getStr(16); // Col Q
    out.responsableagilidad = getStr(18); // Col S
    out.justificacionagilidad = getStr(19); // Col T

    // FACTURACIÓN
    out.tiempofacturacion = getNum(40); // Col AO
    out.cumplefacturacion = getStr(42); // Col AQ
    out.responsablefacturacion = getStr(44); // Col AS
    out.justificacionfacturacion = getStr(45); // Col AT

    // INSPECCIÓN
    out.tiempoinspeccion = getNum(27); // Col AB
    out.detalleinspeccion = getStr(31); // Col AF (FÍSICO)
    out.cumpleinspeccion = getStr(29); // Col AD (SI/NO)
    
    if (out.cumpleinspeccion !== 'SI' && out.cumpleinspeccion !== 'NO' && out.cumpleinspeccion !== 'si' && out.cumpleinspeccion !== 'no') {
      for (let i = 20; i <= 38; i++) {
        let v = getStr(i);
        if (v && String(v).toUpperCase() === 'SI' && i !== 29 && i !== 31) {
          out.cumpleinspeccion = 'SI';
          break;
        } else if (v && String(v).toUpperCase() === 'NO' && i !== 29 && i !== 31) {
          out.cumpleinspeccion = 'NO';
          break;
        }
      }
    }
    
    out.justificacioninspeccion = getStr(32); // Col AG

    // Common fields
    out.do = getStr(0);
    out.do3m = getStr(1);
    out.documentodetransporte = getStr(2);
    out.do_b = getStr(1); // Col B
    out.id_operacion = getStr(2); // Col C
    out.num_doc_trans = getStr(3); // Col D
    out.mododetransporte = formatModoTransporte(r[4] || r[5] || '');
    out.administracion = getStr(5) || getStr(6);
    out.lineadenegocio = getStr(6) || getStr(7);
    out.tipodedeclaracion = getStr(7) || getStr(8);

    return out;
  }).filter(r => r !== null);
}

function normalizeKey(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function parseExcelDateSafe(val) {
  if (typeof val === 'string' && val.includes('0000/00/00')) return 'PENDIENTE';
  if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msInDay = 24 * 60 * 60 * 1000;
    const parsedDate = new Date(excelEpoch.getTime() + val * msInDay);
    return new Date(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate());
  }
  if (typeof val === 'string' && val.trim() !== '') {
    let str = val.trim();
    let sep = str.includes('/') ? '/' : (str.includes('-') ? '-' : null);
    if (sep) {
      let datePart = str.split(/[ T]/)[0];
      const p = datePart.split(sep);
      if (p.length === 3) {
        if (p[2].length === 4) return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
        else if (p[0].length === 4) return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      }
    }
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }
  return null;
}

function normalizeRows(rows) {
  return rows.map(r => {
    const normalized = {};
    Object.keys(r).forEach(k => {
      const normKey = normalizeKey(k);
      let val = r[k];
      if (normKey.includes('fecha') && val !== null) val = parseExcelDateSafe(val);
      normalized[normKey] = val;
    });
    return normalized;
  });
}

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const isNum = v => {
  if (typeof v === 'number') return !isNaN(v);
  if (typeof v === 'string' && v.trim() !== '') return !isNaN(parseFloat(v.replace(',', '.')));
  return false;
};
const numVal = v => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string' && v.trim() !== '') return parseFloat(v.replace(',', '.')) || 0;
  return 0;
};
function avg(arr) { const v = arr.filter(isNum); return v.length ? v.reduce((a, b) => a + numVal(b), 0) / v.length : 0; }
function sum(arr) { return arr.filter(isNum).reduce((a, b) => a + numVal(b), 0); }
function fmtInt(n) { return Math.round(n).toLocaleString('es-CO'); }
function fmtUSD(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function fmtDays(n) { return n.toFixed(1) + ' d'; }

function monthKey(d) {
  if (!(d instanceof Date) || isNaN(d)) return null;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return names[parseInt(m, 10) - 1] + ' ' + y;
}

function uniqueSorted(arr) {
  return [...new Set(arr.filter(v => v !== null && v !== undefined && v !== ''))].sort();
}

function fmtDateUTC(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function parseUTCDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function destroyChart(id) {
  if (App.charts[id]) {
    try { App.charts[id].destroy(); } catch (e) { console.warn("Failed to destroy chart " + id + ":", e); }
    delete App.charts[id];
  }
  const canvas = document.getElementById(id);
  if (canvas) {
    const instance = Chart.getChart(canvas);
    if (instance) {
      try { instance.destroy(); } catch (e) { console.warn("Failed to destroy native chart instance on " + id + ":", e); }
    }
  }
}

function countBy(rows, field, keepBlanks = false) {
  const m = {};
  rows.forEach(r => {
    let v = r[field];
    if (v === null || v === undefined) {
      if (keepBlanks) v = '(En blanco)';
      else return;
    } else {
      v = String(v).trim();
      const uv = v.toUpperCase();
      if (v === '' || v === '-' || uv === 'NA' || uv === 'N/A' || uv === 'NO APLICA' || uv === 'VACIO' || v === '0' || uv === '#N/A') {
        if (keepBlanks) v = '(En blanco)';
        else return;
      }
    }
    m[v] = (m[v] || 0) + 1;
  });
  return m;
}

function getYearsForRows(rows) {
  const years = uniqueSorted(rows.map(r => {
    const d = r['fechaaperturado'];
    return d instanceof Date && !isNaN(d) ? d.getFullYear() : null;
  }).filter(y => y !== null));
  if (years.length === 0) years.push(new Date().getFullYear());
  return years;
}

      function getLineDatasets(rows, years, field, dateField = null, useSum = false, multiplier = 1, requiredField = null) {
        const datasets = [];
        years.forEach((yr, idx) => {
          const data = Array(12).fill(null);
          const counts = Array(12).fill(0);
          const sums = Array(12).fill(0);

          rows.forEach(r => {
            if (requiredField) {
              const reqVal = r[requiredField];
              if (reqVal === null || reqVal === undefined || String(reqVal).trim() === '') return;
            }

            let d = dateField ? r[dateField] : null;
            if (!d) d = r['fechaaperturado'] || r['fechasolicitud'] || r['fechaaprobacion'];

            if (d instanceof Date && !isNaN(d) && d.getFullYear() === yr) {
              const m = d.getMonth();
              const val = r[field];
              if (isNum(val) && numVal(val) >= 0) {
                 sums[m] += numVal(val); counts[m]++;
              }
            }
          });

          for (let m = 0; m < 12; m++) {
            if (counts[m] > 0) {
              let val = useSum ? sums[m] : (sums[m] / counts[m]);
              data[m] = parseFloat((val * multiplier).toFixed(2));
            }
          }

          let color = PALETTE[idx % PALETTE.length];
          if (yr === 2025) color = '#0ea5e9';
          if (yr === 2026) color = '#1e3a8a';

          datasets.push({
            label: yr.toString(),
            data: data,
            borderColor: color,
            backgroundColor: color,
            tension: 0.4,
            fill: false,
            spanGaps: true,
            borderWidth: 3,
            borderDash: [3, 3],
            pointRadius: 3,
            pointHoverRadius: 6
          });
        });
        return datasets;
      }

      // ==========================================
    // MODULE: UPLOADER
    // ==========================================
    const Uploader = {
      pendingFiles: [],
      init() {
        els.fileInput.addEventListener('change', e => {
          if (e.target.files.length > 0) this.queueFiles(Array.from(e.target.files));
        });

        ['dragenter', 'dragover'].forEach(ev => els.uploadZone.addEventListener(ev, e => {
          e.preventDefault(); els.uploadZone.classList.add('drag');
        }));
        ['dragleave', 'drop'].forEach(ev => els.uploadZone.addEventListener(ev, e => {
          e.preventDefault(); els.uploadZone.classList.remove('drag');
        }));
        els.uploadZone.addEventListener('drop', e => {
          if (e.dataTransfer.files.length > 0) this.queueFiles(Array.from(e.dataTransfer.files));
        });

        els.resetBtn.addEventListener('click', () => {
          els.dashboard.style.display = 'none';
          els.uploadZone.style.display = 'block';
          els.resetBtn.style.display = 'none';
          this.resetUploadState();
          App.raw = { indicadores: [], coo: [], registros: [], razones: [] };
          LocalDB.clear();
        });
      },
      resetUploadState() {
        this.pendingFiles = [];
        els.fileNameLabel.textContent = 'Sin archivos cargados';
        els.uploadStatus.style.display = 'none';
        els.uploadError.style.display = 'none';
        els.fileInput.value = '';
      },
      async queueFiles(newFiles) {
        els.uploadError.style.display = 'none';
        const existingNames = this.pendingFiles.map(f => f.name.toLowerCase());
        const uniqueNew = newFiles.filter(f => !existingNames.includes(f.name.toLowerCase()));
        this.pendingFiles = this.pendingFiles.concat(uniqueNew);

        let hasReporte = false, hasStatus = false, hasIT = false;
        this.pendingFiles.forEach(f => {
          const u = f.name.toUpperCase();
          if (u.includes('REPORTE')) hasReporte = true;
          if (u.includes('STATUS')) hasStatus = true;
          if (u.includes('AHORRO') || u.includes('ARANCEL') || u.includes('IT')) hasIT = true;
        });

        els.uploadStatus.style.display = 'block';
        let statusMsg = 'Archivos en cola: ' + this.pendingFiles.map(f => f.name).join(', ') + '.<br/>';

        if (hasReporte && hasStatus && hasIT) {
          statusMsg = '�Los 3 archivos han sido cargados! Procesando...';
          els.uploadStatus.innerHTML = statusMsg;
          const filesToProcess = [...this.pendingFiles];
          this.pendingFiles = [];
          await this.handleFiles(filesToProcess);
        } else if (this.pendingFiles.length === 1 && !hasReporte && !hasStatus && !hasIT) {
          statusMsg = 'Procesando archivo �nico (Consolidado)...';
          els.uploadStatus.innerHTML = statusMsg;
          const filesToProcess = [...this.pendingFiles];
          this.pendingFiles = [];
          await this.handleFiles(filesToProcess);
        } else {
          const missing = [];
          if (!hasReporte) missing.push('REPORTE.xls');
          if (!hasStatus) missing.push('STATUS.xlsx');
          if (!hasIT) missing.push('ahorro arancel.xls');
          statusMsg += `<strong style="color:var(--yellow)">Faltan: ${missing.join(', ')}</strong> (Selecciona m�s archivos).`;
          els.uploadStatus.innerHTML = statusMsg;
        }
      },
      async handleFiles(files) {
        els.uploadError.style.display = 'none';
        els.uploadStatus.style.display = 'block';
        els.uploadStatus.textContent = 'Procesando y consolidando archivos...';

        try {
          const filePromises = files.map(file => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const data = new Uint8Array(e.target.result);
                  const decoder = new TextDecoder('latin1');
                  const textSnippet = decoder.decode(data.slice(0, 1000)).toLowerCase();
                  let wb = null, htmlText = null, tsvText = null;
                  const isBinary = data.slice(0, 1024).some(b => b === 0);

                  if (!isBinary && (textSnippet.includes('<table') || textSnippet.includes('<html'))) htmlText = decoder.decode(data);
                  else if (!isBinary && textSnippet.includes('\t') && (file.name.endsWith('.xls') || file.name.endsWith('.txt'))) tsvText = decoder.decode(data);
                  else wb = XLSX.read(data, { type: 'array', cellDates: true });

                  resolve({ name: file.name, wb: wb, htmlText: htmlText, tsvText: tsvText });
                } catch (err) { reject(new Error(`Error al analizar ${file.name}: ${err.message}`)); }
              };
              reader.onerror = () => reject(new Error(`Error al leer ${file.name}`));
              reader.readAsArrayBuffer(file);
            });
          });

          const results = await Promise.all(filePromises);
          let fileReporte, fileStatus, fileIT;
          results.forEach(res => {
            const upperName = res.name.toUpperCase();
            if (upperName.includes('REPORTE')) fileReporte = res;
            else if (upperName.includes('STATUS')) fileStatus = res;
            else if (upperName.includes('AHORRO') || upperName.includes('ARANCEL') || upperName.includes('IT')) fileIT = res;
          });

          if (!fileReporte && files.length === 1) fileReporte = results[0];

          if (fileReporte && fileReporte.wb && fileReporte.wb.SheetNames.map(n => n.toLowerCase().trim()).includes('indicadores') && files.length === 1) {
            const festivosSheetName = fileReporte.wb.SheetNames.find(n => n.toLowerCase().includes('festivo'));
            if (festivosSheetName) {
              const festivosRaw = XLSX.utils.sheet_to_json(fileReporte.wb.Sheets[festivosSheetName], { header: 1, defval: null });
              let newSet = new Set();
              festivosRaw.forEach(row => {
                row.forEach(cell => {
                  const d = parseExcelDateSafe(cell);
                  if (d) {
                    newSet.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
                  }
                });
              });
              if (newSet.size > 0) holidaysSet = newSet;
            }
            App.raw.indicadores = parseIndicadoresGrouped(fileReporte.wb);
            App.raw.coo = normalizeRows(safeSheet(fileReporte.wb, 'COO'));
            App.raw.registros = normalizeRows(safeSheet(fileReporte.wb, 'Registros'));
            App.raw.razones = normalizeRows(safeSheet(fileReporte.wb, 'Razones'));
          } else {
            if (!fileReporte || !fileStatus || !fileIT) throw new Error('Carga incompleta. Se necesitan los 3 archivos corporativos.');

            if (fileReporte.htmlText) {
              App.raw.indicadores = parseReporteHTML(fileReporte.htmlText);
              App.raw.razones = extractRazones(fileReporte.htmlText);
            } else {
              const festivosSheetName = fileReporte.wb.SheetNames.find(n => n.toLowerCase().includes('festivo'));
              if (festivosSheetName) {
                const festivosRaw = XLSX.utils.sheet_to_json(fileReporte.wb.Sheets[festivosSheetName], { header: 1, defval: null });
                let newSet = new Set();
                festivosRaw.forEach(row => {
                  row.forEach(cell => {
                    const d = parseExcelDateSafe(cell);
                    if (d) {
                      newSet.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
                    }
                  });
                });
                if (newSet.size > 0) holidaysSet = newSet;
              }
              App.raw.indicadores = parseIndicadoresGrouped(fileReporte.wb);
              App.raw.razones = [];
            }

            const wbStatus = fileStatus.wb;
            const statusSheetName = wbStatus.SheetNames.find(n => n.toLowerCase().includes('rim') || n.toLowerCase().includes('data')) || wbStatus.SheetNames[0];
            const statusRaw = XLSX.utils.sheet_to_json(wbStatus.Sheets[statusSheetName], { defval: null });

            App.raw.registros = statusRaw.map(r => {
              const normKey = (k) => k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
              const nr = {};
              for (let k in r) nr[normKey(k)] = r[k];
              const getV = (...keys) => {
                for (let k of keys) if (nr[k] !== undefined && nr[k] !== null && nr[k] !== '') return nr[k];
                return null;
              };

              const d1 = parseExcelDateSafe(getV('fechasolicitudrimenviadaaar', 'fechasolicitud'));
              const d2 = parseExcelDateSafe(getV('fechafinalizacionrevisionrimar', 'aprobacion', 'fechafinalizacionrevisionrimdear'));
              let t = 0, monthStr = '';
              if (d1 && d2) t = getWorkingDays(d1, d2);
              if (d2 instanceof Date && !isNaN(d2)) {
                const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                monthStr = monthNames[d2.getMonth()];
              } else if (d1 instanceof Date && !isNaN(d1)) {
                const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                monthStr = monthNames[d1.getMonth()];
              }

              const negVal = String(getV('negacion') || '').toUpperCase();
              const regAp = String(getV('registroaprobado') || '').toUpperCase();
              let estadoCalculado = 'PENDIENTE';
              if (negVal.includes('SI') || negVal.includes('ERROR') || regAp.includes('ERROR') || regAp.includes('NEGADO')) estadoCalculado = 'NEGADO';
              else if (regAp.startsWith('REG') || regAp === 'OK' || getV('aprobacion') !== null) estadoCalculado = 'APROBADO';
              else if (getV('requerimientoentidad') !== null) estadoCalculado = 'REQUERIDO';

              return {
                sku: getV('producto', 'pedido'),
                noregistro: getV('registroaprobado', 'noregistro', 'documento') || 'PENDIENTE',
                vistobueno: getV('vobo'),
                estado: estadoCalculado,
                tiempo: t,
                mes: monthStr,
                fechasolicitud: d1,
                fechaaprobacion: d2,
                razones: getV('razonnegacon', 'razonrequerimiento', 'observacionparasiaco')
              };
            }).filter(r => r.sku);

            let itRaw = [];
            if (fileIT.tsvText) itRaw = parseTSV(fileIT.tsvText);
            else if (fileIT.wb) itRaw = XLSX.utils.sheet_to_json(fileIT.wb.Sheets[fileIT.wb.SheetNames[0]], { defval: null });

            App.raw.coo = itRaw.map(r => {
              const normKey = (k) => k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
              const nr = {};
              for (let k in r) nr[normKey(k)] = r[k];
              const dLev = parseExcelDateSafe(nr['fechalev'] || nr['fecha'] || nr['fechaaperturado']);
              let mesStr = '', anioVal = null;
              if (dLev instanceof Date && !isNaN(dLev)) {
                const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                mesStr = monthNames[dLev.getMonth()]; anioVal = dLev.getFullYear();
              }

              const base = parseFloat(String(nr['basearancel'] || 0).replace(/[^0-9.-]/g, '')) || 0;
              const tasa = parseFloat(String(nr['tasa'] || 1).replace(',', '.')) || 1;
              const liq = parseFloat(String(nr['liqarancelpesos'] || 0).replace(/[^0-9.-]/g, '')) || 0;
              const arancelVal = parseFloat(String(nr['arancel'] || 0).replace(/[^0-9.-]/g, '')) || 0;
              const acuerdo = String(nr['acuerdo'] || '').trim();

              let ahorro = 0;
              const sub = String(nr['subpartida'] || '').trim();
              if (acuerdo !== '') {
                let standardRate = 0.10;
                if (sub.startsWith('61') || sub.startsWith('62') || sub.startsWith('63')) standardRate = 0.15;
                else if (sub.startsWith('84') || sub.startsWith('85') || sub.startsWith('90')) standardRate = 0.05;
                ahorro = (base * standardRate) / tasa;
              } else if (arancelVal > 0) {
                ahorro = Math.max(0, (base * arancelVal / 100 - liq) / tasa);
              }

              return {
                paisdeorigen: nr['paisorigen'] || nr['pais'] || '',
                subpartida: sub,
                ahorroenusd: nr['ahorroenusd'] !== undefined ? parseFloat(nr['ahorroenusd']) : ahorro,
                mes: mesStr,
                anio: anioVal
              };
            }).filter(r => r.paisdeorigen && r.mes);
          }

          LocalDB.save('lastSession', { raw: App.raw, fileName: files.map(f => f.name).join(', ') });
          FilterEngine.initFilters();
          ChartManager.renderAll();

          els.fileNameLabel.textContent = files.length > 1 ? `${files.length} archivos cargados` : files[0].name;
          els.uploadZone.style.display = 'none';
          els.dashboard.style.display = 'block';
          els.resetBtn.style.display = 'inline-block';

          showNotification('�Archivos procesados correctamente!', 'success');
        } catch (err) {
          console.error(err);
          showError(err.message || 'Error al procesar los archivos.');
          this.resetUploadState();
        }
      }
    };

    // ==========================================
    // MODULE: FILTER ENGINE
    // ==========================================
    const FilterEngine = {
      initFilters() {
        const admins = uniqueSorted(App.raw.indicadores.map(r => r['administracion']));
        const lineas = uniqueSorted(App.raw.indicadores.map(r => r['lineadenegocio']));
        const modos = uniqueSorted(App.raw.indicadores.map(r => r['mododetransporte']));
        const years = uniqueSorted(App.raw.indicadores.map(r => {
          const d = r['fechaaperturado'];
          return (d instanceof Date && !isNaN(d)) ? d.getFullYear().toString() : null;
        }));

        App.filters.admin = new Set();
        App.filters.linea = new Set();
        App.filters.modo = new Set();
        App.filters.year = new Set();

        this.chipRow(document.getElementById('chipAdmin'), admins, 'admin');
        this.chipRow(document.getElementById('chipLinea'), lineas, 'linea');
        this.chipRow(document.getElementById('chipModo'), modos, 'modo');
        this.chipRow(document.getElementById('chipYear'), years, 'year');

        const dates = App.raw.indicadores.map(r => r['fechaaperturado']).filter(d => d instanceof Date && !isNaN(d));
        if (dates.length) {
          const min = new Date(Math.min(...dates));
          const max = new Date(Math.max(...dates));
          document.getElementById('dateFrom').value = fmtDateUTC(min);
          document.getElementById('dateTo').value = fmtDateUTC(max);
        }

        if (!this._listenersInit) {
          document.getElementById('dateFrom').addEventListener('change', () => ChartManager.renderAll());
          document.getElementById('dateTo').addEventListener('change', () => ChartManager.renderAll());
          this._listenersInit = true;
        }
      },
      chipRow(container, values, filterKey) {
        container.innerHTML = '';
        const controls = document.createElement('div');
        controls.className = 'chip-controls';
        const btnAll = document.createElement('button');
        btnAll.className = 'chip-ctrl-btn'; btnAll.textContent = 'Todos';
        const btnNone = document.createElement('button');
        btnNone.className = 'chip-ctrl-btn'; btnNone.textContent = 'Ninguno';
        controls.appendChild(btnAll); controls.appendChild(btnNone);
        container.appendChild(controls);

        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'chips-subrow';

        values.forEach(v => {
          const b = document.createElement('button');
          b.className = 'chip active'; b.textContent = v; b.dataset.value = v;
          b.addEventListener('click', () => {
            b.classList.toggle('active');
            if (b.classList.contains('active')) App.filters[filterKey].add(v);
            else App.filters[filterKey].delete(v);
            ChartManager.renderAll();
          });
          chipsContainer.appendChild(b);
          App.filters[filterKey].add(v);
        });
        container.appendChild(chipsContainer);

        btnAll.addEventListener('click', () => {
          chipsContainer.querySelectorAll('.chip').forEach(chip => {
            chip.classList.add('active'); App.filters[filterKey].add(chip.dataset.value);
          });
          ChartManager.renderAll();
        });
        btnNone.addEventListener('click', () => {
          chipsContainer.querySelectorAll('.chip').forEach(chip => {
            chip.classList.remove('active'); App.filters[filterKey].delete(chip.dataset.value);
          });
          ChartManager.renderAll();
        });
      },
      filteredIndicadores(dateField = null) {
        const fromVal = document.getElementById('dateFrom').value;
        const toVal = document.getElementById('dateTo').value;
        const from = fromVal ? parseUTCDate(fromVal) : null;
        const to = toVal ? parseUTCDate(toVal) : null;
        return App.raw.indicadores.filter(r => {
          if (App.filters.admin.size && !App.filters.admin.has(r['administracion'])) return false;
          if (App.filters.linea.size && !App.filters.linea.has(r['lineadenegocio'])) return false;
          if (App.filters.modo.size && !App.filters.modo.has(r['mododetransporte'])) return false;
          const d = (dateField ? r[dateField] : null) || r['fechaaperturado'];
          if (App.filters.year && App.filters.year.size) {
            const yrStr = (d instanceof Date && !isNaN(d)) ? d.getFullYear().toString() : '';
            if (!App.filters.year.has(yrStr)) return false;
          }
          if (from && d instanceof Date && d < from) return false;
          if (to && d instanceof Date && d >= new Date(to.getTime() + 86400000)) return false;
          return true;
        });
      }
    };

    // ==========================================
    // MODULE: CHART MANAGER
    // ==========================================
    const ChartManager = {
      _rafId: null,
      renderAll() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = requestAnimationFrame(() => {
          this._rafId = null;
          const activeBtn = document.querySelector('.menu-btn.active');
          if (!activeBtn) return;
          const tabId = activeBtn.dataset.tab;

          if (tabId === 'tab-procesos') this.renderProcesos();
          else if (tabId === 'tab-agilidad') this.renderAgilidad();
          else if (tabId === 'tab-facturacion') this.renderFacturacion();
          else if (tabId === 'tab-inspeccion') this.renderInspeccion();
          else if (tabId === 'tab-registros') this.renderRegistros();
          else if (tabId === 'tab-coo') this.renderCOO();
          else if (tabId === 'tab-datos') renderTable();
        });
      },
      renderSubTable(tbodyId, rows, fields, mod = '') {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        const container = tbody.closest('.pbi-table-scroll');
        if (container && container._onScroll) {
          container.removeEventListener('scroll', container._onScroll);
          container._onScroll = null;
          container.scrollTop = 0;
        }
        tbody.innerHTML = '';
        if (!rows.length) {
          tbody.innerHTML = `<tr><td colspan="${fields.length}" style="text-align:center;color:var(--text-light)">No hay datos</td></tr>`;
          return;
        }

        const CHUNK_SIZE = 50;
        let currentIndex = 0;
        const appendRows = (start, end) => {
          const fragment = document.createDocumentFragment();
          rows.slice(start, end).forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = fields.map(f => {
              let val = r[f];
              if (f === 'responsable') val = r['responsable' + mod] || r['responsable'] || r['responsable.1'] || r['responsable.2'];
              if (f.startsWith('justificacion')) val = r[f] || r['justificacion' + mod] || r['justificacion'] || r['justificacion.1'];
              if (val instanceof Date) return `<td>${fmtDateUTC(val)}</td>`;
              return `<td>${val !== null && val !== undefined ? val : '-'}</td>`;
            }).join('');
            fragment.appendChild(tr);
          });
          tbody.appendChild(fragment);
        };

        appendRows(0, CHUNK_SIZE);
        currentIndex = CHUNK_SIZE;

        if (rows.length > CHUNK_SIZE && container) {
          const onScroll = () => {
            if (container.scrollHeight - container.scrollTop - container.clientHeight < 50) {
              if (currentIndex < rows.length) {
                const nextIndex = Math.min(currentIndex + CHUNK_SIZE, rows.length);
                appendRows(currentIndex, nextIndex);
                currentIndex = nextIndex;
              }
            }
          };
          container.addEventListener('scroll', onScroll);
          container._onScroll = onScroll;
        }
      },
      renderModuloKPI(config) {
        let rows = FilterEngine.filteredIndicadores(config.campoFecha);

        if (config.mod === 'agilidad' || config.mod === 'facturacion') {
          rows = rows.filter(r => r.fechadelevante instanceof Date && !isNaN(r.fechadelevante));
        }

        if (!App.chartFilters) App.chartFilters = {};

        this.barChart(config.chartDona, countBy(rows, config.campoCumplimiento, config.keepDonaBlanks), 'doughnut', (label) => {
          if (label && App.chartFilters[config.mod] !== label) {
            App.chartFilters[config.mod] = label;
          } else {
            App.chartFilters[config.mod] = null;
          }
          this.renderModuloKPI(config);
        }, App.chartFilters[config.mod]);

        if (App.chartFilters[config.mod]) {
          rows = rows.filter(r => String(r[config.campoCumplimiento]).toUpperCase() === App.chartFilters[config.mod].toUpperCase());
        }

        let reqRows = rows;
        if (config.requiredField) {
          reqRows = rows.filter(r => r[config.requiredField] !== null && r[config.requiredField] !== undefined && String(r[config.requiredField]).trim() !== '');
        }

        const valoresTiempo = reqRows.map(r => r[config.campoTiempo]).filter(v => isNum(v) && numVal(v) >= 0);
        let tiempoAvg = valoresTiempo.length ? valoresTiempo.reduce((a, b) => a + numVal(b), 0) / valoresTiempo.length : 0;
        
        if (config.multiplier) {
          tiempoAvg *= config.multiplier;
        }

        const elTT = document.getElementById(config.elTT);
        const elDT = document.getElementById(config.elDT);
        if (elTT) elTT.textContent = tiempoAvg.toFixed(2).replace('.', ',');

        let dtRows = rows;
        if (config.dtRequiresFechaLevante) {
          dtRows = dtRows.filter(r => r.fechadelevante instanceof Date && !isNaN(r.fechadelevante));
        }
        let dtCount = dtRows.length;
        if (config.dtFilterField) {
          if (config.dtFilterValue) {
            dtCount = dtRows.filter(r => String(r[config.dtFilterField]).toUpperCase() === String(config.dtFilterValue).toUpperCase()).length;
          } else {
            dtCount = dtRows.filter(r => {
              const v = r[config.dtFilterField];
              return v !== null && v !== undefined && String(v).trim() !== '';
            }).length;
          }
        }
        if (elDT) elDT.textContent = fmtInt(dtCount);

        const years = getYearsForRows(rows);
        this.renderLineChart(config.chartLinea, getLineDatasets(rows, years, config.campoTiempo, config.campoFecha, false, config.multiplier || 1, config.requiredField));

        if (config.chartJust && document.getElementById(config.chartJust)) {
          this.barChart(config.chartJust, countBy(rows.filter(r => String(r[config.campoCumplimiento]).toUpperCase() === 'NO'), config.campoJustificacion), 'pie', null, null, 'right');
        }

        if (config.tblJust) {
          const tblJust = document.getElementById(config.tblJust);
          if (tblJust) {
            tblJust.innerHTML = '';
            const fromVal = document.getElementById('dateFrom').value;
            const toVal = document.getElementById('dateTo').value;
            const from = fromVal ? parseUTCDate(fromVal) : null;
            const to = toVal ? parseUTCDate(toVal) : null;

            const nonCompliant = rows.filter(r => String(r[config.campoCumplimiento]).toUpperCase() === 'NO' && r[config.campoJustificacion]);

            const grouped = {};
            nonCompliant.forEach(r => {
              let d = config.campoFecha ? r[config.campoFecha] : (r['fechaaperturado'] || r['fechasolicitud']);
              if (from && d instanceof Date && d < from) return;
              if (to && d instanceof Date && d >= new Date(to.getTime() + 86400000)) return;

              const mKey = d instanceof Date && !isNaN(d) ? monthKey(d) : '0000-00';

              const responsable = r[config.campoJustificacion] || 'SIN RESPONSABLE';
              const causal = (config.campoCausal && r[config.campoCausal]) ? r[config.campoCausal] : 'SIN CAUSAL';

              const key = `${mKey}::${responsable}::${causal}`;
              if (!grouped[key]) {
                grouped[key] = {
                  monthKey: mKey,
                  monthLabel: d instanceof Date && !isNaN(d) ? monthLabel(mKey) : 'N/A',
                  responsable: responsable,
                  causal: causal,
                  count: 0
                };
              }
              grouped[key].count++;
            });

            let rowsData = Object.values(grouped);
            rowsData.sort((a, b) => {
              if (a.monthKey !== b.monthKey) return a.monthKey.localeCompare(b.monthKey);
              return b.count - a.count;
            });

            if (rowsData.length > 0) {
              const fragment = document.createDocumentFragment();
              rowsData.forEach((r, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td style="text-transform:capitalize; white-space:nowrap;">${r.monthLabel}</td>
                    <td>${r.responsable}</td>
                    <td>${r.causal}</td>
                    <td style="text-align:center; font-weight:bold;">${r.count}</td>
                  `;
                fragment.appendChild(tr);
              });
              tblJust.appendChild(fragment);
            } else {
              tblJust.innerHTML = '<tr><td colspan="5" style="text-align:center;">Sin registros</td></tr>';
            }
          }
        }
         if (config.tblDetalle && config.columnasTabla) {
          let tableRows = rows;
          if (config.tblFilterField && config.tblFilterValue) {
             tableRows = tableRows.filter(r => String(r[config.tblFilterField]).toUpperCase() === String(config.tblFilterValue).toUpperCase());
          }
          this.renderSubTable(config.tblDetalle, tableRows, config.columnasTabla, config.mod);
        }
      },
    };

    // ==========================================
    // MODULE: TABLE VIEW
    // ==========================================
    function renderTable() {
      const rawData = App.raw[App.tableState.activeSheet] || [];
      let filtered = rawData;
      if (App.tableState.searchQuery) {
        filtered = rawData.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(App.tableState.searchQuery)));
      }
      const totalPages = Math.max(1, Math.ceil(filtered.length / App.tableState.pageSize));
      if (App.tableState.currentPage > totalPages) App.tableState.currentPage = totalPages;

      const startIdx = (App.tableState.currentPage - 1) * App.tableState.pageSize;
      const pageData = filtered.slice(startIdx, startIdx + App.tableState.pageSize);

      if (document.getElementById('tableCurrentRowsCount')) document.getElementById('tableCurrentRowsCount').textContent = pageData.length;
      if (document.getElementById('tableTotalRowsCount')) document.getElementById('tableTotalRowsCount').textContent = filtered.length;
      if (document.getElementById('tableCurrentPage')) document.getElementById('tableCurrentPage').textContent = App.tableState.currentPage;
      if (document.getElementById('tableTotalPages')) document.getElementById('tableTotalPages').textContent = totalPages;

      document.getElementById('tablePrevBtn').disabled = App.tableState.currentPage === 1;
      document.getElementById('tableNextBtn').disabled = App.tableState.currentPage === totalPages;

      const hRow = document.getElementById('premiumDataTableHeader'); hRow.innerHTML = '';
      const bContainer = document.getElementById('premiumDataTableBody'); bContainer.innerHTML = '';

      if (!pageData.length) {
        hRow.innerHTML = '<th>Sin registros</th>'; return;
      }

      const headers = Object.keys(pageData[0]);
      headers.forEach(h => { const th = document.createElement('th'); th.textContent = h.toUpperCase(); hRow.appendChild(th); });

      pageData.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
          const td = document.createElement('td'); const val = row[h];
          if (val instanceof Date) td.textContent = val.toLocaleDateString('es-CO');
          else if (typeof val === 'number') td.textContent = h.includes('ahorro') ? fmtUSD(val) : val.toLocaleString('es-CO');
          else td.textContent = val !== null && val !== undefined ? val : '-';
          tr.appendChild(td);
        });
        bContainer.appendChild(tr);
      });
    }

    // ==========================================
    // MODULE: CORE EVENTS SYSTEM
    // ==========================================
    const CoreEvents = {
      init() {
        document.querySelectorAll('.menu-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const pane = document.getElementById(btn.dataset.tab); if (pane) pane.classList.add('active');
            ChartManager.renderAll();
          });
        });

        document.getElementById('tableSheetSelect').addEventListener('change', (e) => {
          App.tableState.activeSheet = e.target.value; App.tableState.currentPage = 1; renderTable();
        });
        document.getElementById('tableSearchInput').addEventListener('input', (e) => {
          App.tableState.searchQuery = e.target.value.toLowerCase().trim(); App.tableState.currentPage = 1; renderTable();
        });
        document.getElementById('tablePrevBtn').addEventListener('click', () => { if (App.tableState.currentPage > 1) { App.tableState.currentPage--; renderTable(); } });
        document.getElementById('tableNextBtn').addEventListener('click', () => { App.tableState.currentPage++; renderTable(); });
        if (els.printBtn) els.printBtn.addEventListener('click', () => window.print());

        document.getElementById('btnExportExcel').addEventListener('click', () => {
          const data = App.raw[App.tableState.activeSheet] || [];
          if (!data.length) return;
          const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, App.tableState.activeSheet);
          XLSX.writeFile(wb, `Reporte_${App.tableState.activeSheet}.xlsx`);
        });

        document.getElementById('presentationModeBtn').addEventListener('click', () => {
          document.body.classList.toggle('presentation-mode');
          if (App.worldMapInstance) setTimeout(() => App.worldMapInstance.updateSize(), 150);
        });
      }
    };

    CoreEvents.init();
    Uploader.init();

    LocalDB.load('lastSession').then(session => {
      if (session && session.raw) {
        App.raw = session.raw; FilterEngine.initFilters(); ChartManager.renderAll();
        els.fileNameLabel.textContent = session.fileName || 'Sesi�n guardada';
        els.uploadZone.style.display = 'none'; els.dashboard.style.display = 'block'; els.resetBtn.style.display = 'inline-block';
      }
    });






    ChartManager.barChart = function (id, dataMap, type, clickHandler = null, activeFilter = null, legendPos = 'bottom') {
      destroyChart(id);
      const canvasEl = document.getElementById(id); if (!canvasEl) return;
      const total = Object.values(dataMap).reduce((a, b) => a + b, 0);

      let bgColors = PALETTE;
      const labels = Object.keys(dataMap);
      if (id.toLowerCase().includes('cumple') || id.toLowerCase().includes('estado')) {
        bgColors = labels.map(label => {
          const l = String(label).toUpperCase();
          let color = PALETTE[0];
          if (l === 'SI' || l === 'CUMPLE' || l === 'APROBADO' || l === 'AUTORIZADO') color = '#1AAB40';
          else if (l === 'NO' || l === 'NO CUMPLE' || l === 'RECHAZADO') color = '#D64550';
          else if (l === 'VENCIDO') color = '#F59E0B';

          if (activeFilter && l !== String(activeFilter).toUpperCase()) {
            return color + '40'; // Add transparency if not selected
          }
          return color;
        });
      }

      App.charts[id] = new Chart(canvasEl, {
        type: type,
        data: { labels: labels, datasets: [{ data: Object.values(dataMap), backgroundColor: bgColors }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          layout: { padding: 45 },
          onClick: (e, activeElements) => {
            if (activeElements.length > 0 && clickHandler) {
              const idx = activeElements[0].index;
              const label = App.charts[id].data.labels[idx];
              setTimeout(() => clickHandler(label), 0);
            } else if (clickHandler) {
              setTimeout(() => clickHandler(null), 0);
            }
          },
          plugins: {
            legend: {
              position: type === 'pie' ? 'right' : 'bottom',
              labels: { boxWidth: 10, font: { size: 9 } },
              onClick: (e, legendItem, legend) => {
                if (clickHandler) {
                  const label = legendItem.text;
                  if (activeFilter === label) {
                    setTimeout(() => clickHandler(null), 0);
                  } else {
                    setTimeout(() => clickHandler(label), 0);
                  }
                } else {
                  Chart.defaults.plugins.legend.onClick.call(legend.chart, e, legendItem, legend);
                }
              }
            },
            datalabels: {
              display: function(context) {
                return context.dataset.data[context.dataIndex] > 0;
              },
              color: '#333',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 3,
              font: { size: 10, weight: '600' },
              formatter: (value, ctx) => {
                if (!value || total === 0) return '';
                let pctNum = (value * 100 / total);
                let pct = pctNum.toFixed(2).replace('.', ',');
                return `${value} (${pct}%)`;
              },
              anchor: 'end',
              align: 'end',
              offset: 4
            }
          }
        }
      });
    },
      ChartManager.renderLineChart = function (id, datasets) {
        destroyChart(id);
        const canvasEl = document.getElementById(id); if (!canvasEl) return;

        let yAxisTitle = '';
        if (id.toLowerCase().includes('agilidad')) yAxisTitle = 'Tiempo Agilidad';
        else if (id.toLowerCase().includes('factura')) yAxisTitle = 'Tiempo Facturación';
        else if (id.toLowerCase().includes('inspeccion')) yAxisTitle = 'Tiempo Inspección';

        App.charts[id] = new Chart(canvasEl, {
          type: 'line',
          data: {
            labels: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
            datasets: datasets
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { top: 20, right: 20 } },
            plugins: {
              legend: {
                position: 'top',
                labels: { usePointStyle: true, boxWidth: 6, font: { size: 12 } },
                title: { display: true, text: 'Año', font: { weight: 'bold', size: 13 } }
              },
              datalabels: {
                display: true,
                align: 'top',
                color: '#605e5c',
                font: { size: 10, weight: '600' },
                formatter: (val) => val !== null ? val.toString().replace('.', ',') : ''
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'Mes', font: { weight: 'bold', color: '#333' } },
                ticks: { maxRotation: 45, minRotation: 45 },
                grid: { display: false }
              },
              y: {
                title: { display: true, text: yAxisTitle, font: { weight: 'bold', color: '#333' } },
                beginAtZero: true,
                grid: { borderDash: [2, 2], color: '#e5e7eb' }
              }
            }
          }
        });
      }

