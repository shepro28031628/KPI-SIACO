// js/tab_clasificacion.js

if (typeof ChartManager === 'undefined') {
    window.ChartManager = {};
}

window.clasificacionFilters = {
    year: new Set(),
    empresa: new Set()
};

function renderClasificacionFilters() {
    const raw = window.CLASIFICACION_RAW_DATA;
    if (!raw || !raw.datos) return;

    // Get unique years and empresas
    const years = new Set();
    const empresas = new Set();
    
    raw.datos.forEach(d => {
        if (d.year) years.add(d.year);
        if (d.cliente) empresas.add(d.cliente);
    });

    // Helper to render chips
    const renderChips = (containerId, items, filterSet) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="chip-controls" style="display: flex; gap: 6px; margin-bottom: 4px; width: 100%;">
                <button class="chip-ctrl-btn" data-action="all">Todos</button>
                <button class="chip-ctrl-btn" data-action="none">Ninguno</button>
            </div>
            <div class="chips-subrow" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 6px; overflow: visible; max-height: none;"></div>
        `;
        
        const subrow = container.querySelector('.chips-subrow');
        
        Array.from(items).sort().forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'chip' + (filterSet.has(item) ? ' active' : '');
            btn.textContent = item;
            btn.onclick = () => {
                if (filterSet.has(item)) filterSet.delete(item);
                else filterSet.add(item);
                renderClasificacionFilters(); // re-render filters UI
                ChartManager.renderClasificacion(); // re-render charts
            };
            subrow.appendChild(btn);
        });

        // Add events for All / None
        const btnAll = container.querySelector('[data-action="all"]');
        const btnNone = container.querySelector('[data-action="none"]');
        
        btnAll.onclick = () => {
            filterSet.clear();
            items.forEach(i => filterSet.add(i));
            renderClasificacionFilters();
            ChartManager.renderClasificacion();
        };
        
        btnNone.onclick = () => {
            filterSet.clear();
            renderClasificacionFilters();
            ChartManager.renderClasificacion();
        };
    };

    renderChips('chipYearClasificacion', years, window.clasificacionFilters.year);
    renderChips('chipEmpresaClasificacion', empresas, window.clasificacionFilters.empresa);
}

ChartManager.renderClasificacion = function() {
    const raw = window.CLASIFICACION_RAW_DATA;
    if (!raw || !raw.datos) {
        console.error("CLASIFICACION_RAW_DATA not loaded");
        return;
    }

    // Apply filters to data
    const filters = window.clasificacionFilters;
    const filteredDatos = raw.datos.filter(d => {
        if (filters.year.size > 0 && !filters.year.has(d.year)) return false;
        if (filters.empresa.size > 0 && !filters.empresa.has(d.cliente)) return false;
        return true;
    });

    const validProducts = new Set(filteredDatos.map(d => d.producto));

    // Aggregate Total Productos
    const totalProductos = validProducts.size;
    const valTotalProductos = document.getElementById('valTotalProductos');
    if (valTotalProductos) {
        valTotalProductos.textContent = totalProductos.toLocaleString('es-CO');
    }

    // Aggregate Company Month Counts
    const productsByCompanyAndMonth = {};
    filteredDatos.forEach(d => {
        if (d.month && d.year) {
            const monthYear = `${d.month} ${d.year}`;
            if (!productsByCompanyAndMonth[d.cliente]) productsByCompanyAndMonth[d.cliente] = {};
            if (!productsByCompanyAndMonth[d.cliente][monthYear]) productsByCompanyAndMonth[d.cliente][monthYear] = new Set();
            productsByCompanyAndMonth[d.cliente][monthYear].add(d.producto);
        }
    });

    // Aggregate Restrictions
    const restrictionsCount = {};
    const productRestrictionsArray = [];
    raw.restricciones.forEach(r => {
        if (validProducts.has(r.producto)) {
            if (!restrictionsCount[r.restriccion]) restrictionsCount[r.restriccion] = 0;
            restrictionsCount[r.restriccion]++;
            productRestrictionsArray.push(r);
        }
    });

    const sortedRestrictions = Object.entries(restrictionsCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => ({ name: entry[0], count: entry[1] }));

    // --- Render Top 5 Restrictions Chart ---
    const ctx = document.getElementById('chartRestricciones');
    if (ctx) {
        if (window.App && window.App.charts && window.App.charts.restricciones) {
            window.App.charts.restricciones.destroy();
        }

        const topRestrictions = sortedRestrictions.slice(0, 5);
        const labels = topRestrictions.map(r => r.name.length > 30 ? r.name.substring(0, 30) + '...' : r.name);
        const counts = topRestrictions.map(r => r.count);

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad de Productos',
                    data: counts,
                    backgroundColor: ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7'],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                layout: { padding: { right: 30 } },
                plugins: {
                    legend: { display: false },
                    datalabels: { display: true, anchor: 'end', align: 'right', color: '#605e5c', font: { weight: 'bold', size: 11 } },
                    tooltip: { callbacks: { title: (context) => topRestrictions[context[0].dataIndex].name } }
                },
                scales: {
                    x: { beginAtZero: true, grid: { display: false } },
                    y: { grid: { display: false }, ticks: { autoSkip: false } }
                }
            }
        });
        if (!window.App) window.App = { charts: {} };
        window.App.charts.restricciones = chart;
    }

    // --- Render Company by Month Chart ---
    const ctx2 = document.getElementById('chartProductosEmpresaMes');
    if (ctx2) {
        if (window.App && window.App.charts && window.App.charts.productosEmpresaMes) {
            window.App.charts.productosEmpresaMes.destroy();
        }

        const allMonthsSet = new Set();
        Object.values(productsByCompanyAndMonth).forEach(companyData => {
            Object.keys(companyData).forEach(my => allMonthsSet.add(my));
        });
        
        const monthOrder = { 'Ene':0, 'Feb':1, 'Mar':2, 'Abr':3, 'May':4, 'Jun':5, 'Jul':6, 'Ago':7, 'Sep':8, 'Oct':9, 'Nov':10, 'Dic':11 };
        const sortedMonths = Array.from(allMonthsSet).sort((a, b) => {
            const [mA, yA] = a.split(' ');
            const [mB, yB] = b.split(' ');
            if (yA !== yB) return parseInt(yA) - parseInt(yB);
            return monthOrder[mA] - monthOrder[mB];
        });

        const colors = ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#00B8AA', '#F2C80F'];
        let colorIdx = 0;
        const datasets = Object.keys(productsByCompanyAndMonth).map(company => {
            const companyData = productsByCompanyAndMonth[company];
            const datasetData = sortedMonths.map(my => companyData[my] ? companyData[my].size : 0);
            const dataset = {
                label: company.length > 30 ? company.substring(0, 30) + '...' : company,
                data: datasetData,
                backgroundColor: colors[colorIdx % colors.length],
                borderColor: colors[colorIdx % colors.length],
                borderWidth: 1, borderRadius: 4
            };
            colorIdx++;
            return dataset;
        });

        const chart2 = new Chart(ctx2, {
            type: 'bar',
            data: { labels: sortedMonths, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    datalabels: { display: true, anchor: 'end', align: 'top', color: '#605e5c', font: { weight: 'bold', size: 10 } },
                    tooltip: { callbacks: { title: (context) => sortedMonths[context[0].dataIndex] } }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } }
                },
                layout: { padding: { top: 20 } }
            }
        });
        if (!window.App) window.App = { charts: {} };
        window.App.charts.productosEmpresaMes = chart2;
    }

    // --- Populate Details Table ---
    const tbody = document.getElementById('tblDetalleClasificacionBody');
    if (tbody) {
        tbody.innerHTML = '';
        const limit = Math.min(productRestrictionsArray.length, 100);
        for (let i = 0; i < limit; i++) {
            const row = productRestrictionsArray[i];
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${row.producto}</td><td>${row.restriccion}</td>`;
            tbody.appendChild(tr);
        }
        if (productRestrictionsArray.length > 100) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="2" style="text-align: center; color: #666; font-style: italic;">Mostrando los primeros 100 registros de ${productRestrictionsArray.length}</td>`;
            tbody.appendChild(tr);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const init = () => {
        renderClasificacionFilters();
        ChartManager.renderClasificacion();
    };

    const tabClasificacion = document.getElementById('tab-clasificacion');
    if (tabClasificacion && tabClasificacion.classList.contains('active')) {
        setTimeout(init, 100);
    }

    const menuBtns = document.querySelectorAll('.menu-btn[data-tab="tab-clasificacion"]');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(init, 100);
        });
    });
});
