const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const xlsx = require('xlsx');

async function updateCache() {
  console.log('🔄 Inicializando entorno virtual...');
  
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="uploadZone"></div>
    <div id="fileInput"></div>
    <div id="hiddenFileInput"></div>
    <div id="fileBtn"></div>
    <div id="uploadStatus"></div>
    <div id="uploadError"></div>
    <div id="dashboard"></div>
    <div id="resetBtn"></div>
    <div id="fileNameLabel"></div>
    <div id="activeFiltersBadge"></div>
    <div id="activeFiltersText"></div>
    <div id="custom-tooltip"></div>
    <div id="presentationModeBtn"></div>
    <div id="printReportBtn"></div>
    <div id="chipYear"></div>
    <div id="chipAdmin"></div>
    <div id="chipLinea"></div>
    <div id="chipModo"></div>
    <div id="dateFrom"></div>
    <div id="dateTo"></div>
    <div id="tableSearchInput"></div>
    <div id="tableSheetSelect"></div>
  </body></html>`, { url: 'http://localhost' });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.File = dom.window.File;
  global.FileReader = dom.window.FileReader;
  global.Blob = dom.window.Blob;

  // Polyfill URL.createObjectURL since JSDOM doesn't implement it
  global.URL.createObjectURL = () => 'blob:mock';

  // Make XLSX available
  global.window.XLSX = xlsx;
  
  // Mock getElementById to always return a dummy element if not found
  const originalGetElementById = dom.window.document.getElementById.bind(dom.window.document);
  dom.window.document.getElementById = (id) => {
    let el = originalGetElementById(id);
    if (!el) {
      el = dom.window.document.createElement('div');
      el.id = id;
      dom.window.document.body.appendChild(el);
    }
    return el;
  };

  console.log('📦 Cargando app.js...');
  const appJsCode = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf-8');
  
  // Disable the auto download in our automated script to avoid errors with `a.click()`
  const patchedAppJs = 'const XLSX = window.XLSX;\n' + appJsCode
    .replace('a.click();', 'console.log("Mock download triggered");')
    .replace('function autoLoad() {', 'function autoLoad() { return false; ') // Force skip autoload
    + '\nwindow.capturedApp = App;\nwindow.capturedUploader = Uploader;\nwindow.capturedLocalDB = LocalDB;\n';

  dom.window.eval(patchedAppJs);

  // Mock IndexedDB
  dom.window.indexedDB = {};
  dom.window.capturedLocalDB.save = async () => {};

  console.log('📂 Leyendo archivos de datos...');
  const filePaths = [
    'data/REPORTE.xls',
    'data/STATUS.xlsx',
    'data/ahorro arancel.xls'
  ];

  const files = [];
  for (const fp of filePaths) {
    const fullPath = path.join(__dirname, fp);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Archivo no encontrado: ${fp}`);
      continue;
    }
    const buffer = fs.readFileSync(fullPath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const file = new dom.window.File([arrayBuffer], path.basename(fullPath), { 
      type: fp.endsWith('.xls') ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    files.push(file);
  }

  if (files.length === 0) {
    console.error('❌ No se encontraron archivos para procesar.');
    process.exit(1);
  }

  console.log(`🚀 Procesando ${files.length} archivos... esto tomará unos segundos.`);

  try {
    await dom.window.capturedUploader.handleFiles(files);
    
    console.log('✅ Archivos procesados. Guardando default_data.js...');
    const dataStr = "// Pre-built dataset\nwindow.DEFAULT_DATA = " + JSON.stringify({raw: dom.window.capturedApp.raw});
    fs.writeFileSync(path.join(__dirname, 'js/default_data.js'), dataStr);
    
    console.log('🎉 ¡Caché actualizada correctamente! js/default_data.js pesa:', (dataStr.length / 1024 / 1024).toFixed(2), 'MB');
  } catch (err) {
    console.error('❌ Error al procesar:', err);
  }
}

updateCache();
