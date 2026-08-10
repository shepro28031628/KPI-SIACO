const fs = require('fs');

const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="uploadZone" style="display: none;"></div>
  <div id="dashboard" style="display: block;"></div>
  <div id="fileNameLabel">Cargando datos...</div>
  <button id="resetBtn" style="display: none;">Cargar otros archivos</button>
  <input id="fileInput" type="file" style="display: none;"/>
  <label id="fileBtn" style="display: none;">Seleccionar archivos</label>
  <div id="uploadStatus"></div>
  <div id="activeFiltersBadge"></div>
  <span id="activeFiltersText"></span>
  <button id="clearFiltersBtn">✕</button>
  <div id="chipAdmin"></div>
  <div id="chipLinea"></div>
  <div id="chipTransport"></div>
  <div id="chipYear"></div>
  <span id="labelYear"></span>
  <div id="filterGroupTransport"></div>
  <input id="dateFrom" type="date"/>
  <input id="dateTo" type="date"/>
  <button id="themeToggle"></button>
  <button id="presentationModeBtn"></button>
  <div class="sidebar-menu">
    <a class="menu-btn active" data-tab="tab-procesos" href="procesos.html"></a>
  </div>
  <div class="tab-pane active" id="tab-procesos"></div>
  <canvas id="chartDocsMes"></canvas>
</body></html>`);

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.requestAnimationFrame = (cb) => { setTimeout(cb, 0); return 1; };
global.cancelAnimationFrame = () => {};
global.Chart = {
  register: () => {},
  defaults: { font: {}, plugins: {} }
};
global.ChartDataLabels = {};

try {
  // Load default_data.js
  const defaultDataCode = fs.readFileSync('js/default_data.js', 'utf8');
  eval(defaultDataCode);
  console.log("default_data.js loaded");

  // Load app.js
  const appJsCode = fs.readFileSync('js/app.js', 'utf8');
  eval(appJsCode);
  console.log("app.js loaded");

  // Run autoLoad
  window.Uploader.autoLoad().then(() => {
    console.log("autoLoad finished. Label text:", document.getElementById('fileNameLabel').textContent);
  }).catch(err => {
    console.error("autoLoad threw inside promise:", err);
  });
} catch(err) {
  console.error("Error evaluating scripts:", err);
}
