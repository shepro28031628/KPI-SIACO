const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('data/Reporte linde.xlsx');
const datosGenerales = XLSX.utils.sheet_to_json(workbook.Sheets['Datos Generales'], { raw: false });
const restriccionesLegales = XLSX.utils.sheet_to_json(workbook.Sheets['Restricciones Legales'], { raw: false });

// Extract needed data from Datos Generales
const products = new Set();
const times = [];

datosGenerales.forEach(row => {
    const productCode = row['CÓDIGO DE PRODUCTO'] || row['CÃ“DIGO DE PRODUCTO'];
    if (productCode) {
        products.add(productCode);
    }
    
    // Dates can be MM/DD/YYYY or DD/MM/YYYY string or serial if raw:true
    // Since raw:false they are formatted strings. Let's parse them.
    const fechaCreacionStr = row['FECHA DE CREACIÓN'] || row['FECHA DE CREACIÃ“N'];
    const fechaClasificacionStr = row['FECHA DE CLASIFICACIÓN'] || row['FECHA DE CLASIFICACIÃ“N'];
    
    if (fechaCreacionStr && fechaClasificacionStr) {
        const fc = new Date(fechaCreacionStr);
        const fcl = new Date(fechaClasificacionStr);
        if (!isNaN(fc) && !isNaN(fcl)) {
            const diffTime = Math.abs(fcl - fc);
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            times.push(diffDays);
        } else {
            // Try parsing DD/MM/YYYY
            const parts1 = fechaCreacionStr.split('/');
            const parts2 = fechaClasificacionStr.split('/');
            if (parts1.length === 3 && parts2.length === 3) {
                const fc2 = new Date(parts1[2], parts1[1]-1, parts1[0]);
                const fcl2 = new Date(parts2[2], parts2[1]-1, parts2[0]);
                if (!isNaN(fc2) && !isNaN(fcl2)) {
                    const diffTime = Math.abs(fcl2 - fc2);
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    times.push(diffDays);
                }
            }
        }
    }
});

const totalProductos = products.size;
const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

// Extract needed data from Restricciones Legales
const restrictionsCount = {};
const productRestrictions = []; // { product: '', restriction: '' }

restriccionesLegales.forEach(row => {
    const restriction = row['NOMBRE RESTRICCIÓN'] || row['NOMBRE RESTRICCIÃ“N'];
    const product = row['CÓDIGO DE PRODUCTO'] || row['CÃ“DIGO DE PRODUCTO'];
    
    if (restriction && product) {
        if (!restrictionsCount[restriction]) {
            restrictionsCount[restriction] = 0;
        }
        restrictionsCount[restriction]++;
        productRestrictions.push({
            producto: product,
            restriccion: restriction
        });
    }
});

// Sort restrictions
const sortedRestrictions = Object.entries(restrictionsCount)
    .sort((a, b) => b[1] - a[1])
    .map(entry => ({ name: entry[0], count: entry[1] }));

const output = {
    totalProductos,
    averageTime,
    timesCount: times.length,
    sortedRestrictions,
    productRestrictions
};

const jsContent = `window.CLASIFICACION_DATA = ${JSON.stringify(output, null, 2)};\n`;
fs.writeFileSync('js/data_clasificacion.js', jsContent);
console.log('Successfully generated js/data_clasificacion.js');
