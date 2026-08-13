// js/tab_clasificacion.js

if (typeof ChartManager === 'undefined') {
    window.ChartManager = {};
}

ChartManager.renderClasificacion = function() {
    const data = window.CLASIFICACION_DATA;
    if (!data) {
        console.error("CLASIFICACION_DATA not loaded");
        return;
    }

    // 1. Update KPI Cards
    const valTotalProductos = document.getElementById('valTotalProductos');
    if (valTotalProductos) {
        valTotalProductos.textContent = data.totalProductos.toLocaleString('es-CO');
    }

    const valTiempoClasificacion = document.getElementById('valTiempoClasificacion');
    if (valTiempoClasificacion) {
        valTiempoClasificacion.textContent = data.averageTime.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // 2. Render Chart for Top 5 Restrictions
    const ctx = document.getElementById('chartRestricciones');
    if (ctx) {
        // Destroy existing chart if it exists
        if (window.App && window.App.charts && window.App.charts.restricciones) {
            window.App.charts.restricciones.destroy();
        }

        const topRestrictions = data.sortedRestrictions.slice(0, 5);
        const labels = topRestrictions.map(r => {
            // Trim long names for the chart labels
            return r.name.length > 30 ? r.name.substring(0, 30) + '...' : r.name;
        });
        const counts = topRestrictions.map(r => r.count);

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad de Productos',
                    data: counts,
                    backgroundColor: [
                        '#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7'
                    ],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bar chart
                layout: {
                    padding: {
                        right: 30 // add space for datalabels
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'right',
                        color: '#605e5c',
                        font: {
                            weight: 'bold',
                            size: 11
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => topRestrictions[context[0].dataIndex].name
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { display: false }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            autoSkip: false
                        }
                    }
                }
            }
        });

        if (!window.App) window.App = { charts: {} };
        if (!window.App.charts) window.App.charts = {};
        window.App.charts.restricciones = chart;
    }

    // 3. Populate Details Table
    const tbody = document.getElementById('tblDetalleClasificacionBody');
    if (tbody) {
        tbody.innerHTML = '';
        // Show up to 100 rows to avoid freezing the browser if data is large
        const limit = Math.min(data.productRestrictions.length, 100);
        for (let i = 0; i < limit; i++) {
            const row = data.productRestrictions[i];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.producto}</td>
                <td>${row.restriccion}</td>
            `;
            tbody.appendChild(tr);
        }
        
        if (data.productRestrictions.length > 100) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="2" style="text-align: center; color: #666; font-style: italic;">Mostrando los primeros 100 registros de ${data.productRestrictions.length}</td>`;
            tbody.appendChild(tr);
        }
    }
};

// Auto-run when the tab is displayed
document.addEventListener('DOMContentLoaded', () => {
    // Check if the tab is active on load
    const tabClasificacion = document.getElementById('tab-clasificacion');
    if (tabClasificacion && tabClasificacion.classList.contains('active')) {
        setTimeout(() => ChartManager.renderClasificacion(), 100);
    }

    // Add click listener to the tab button in case they navigate here via JS tabs
    const menuBtns = document.querySelectorAll('.menu-btn[data-tab="tab-clasificacion"]');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => ChartManager.renderClasificacion(), 100);
        });
    });
});
