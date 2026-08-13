const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('data/Reporte linde.xlsx');
const datosGenerales = XLSX.utils.sheet_to_json(workbook.Sheets['Datos Generales'], { raw: false });
const restriccionesLegales = XLSX.utils.sheet_to_json(workbook.Sheets['Restricciones Legales'], { raw: false });

const rawDatos = [];
datosGenerales.forEach(row => {
    const productCode = row['CÓDIGO DE PRODUCTO'] || row['CÃ“DIGO DE PRODUCTO'];
    const company = row['CLIENTE'];
    const fechaCreacionStr = row['FECHA DE CREACIÓN'] || row['FECHA DE CREACIÃ“N'];
    
    if (productCode) {
        let year = null;
        let month = null;
        let dateObj = null;

        if (fechaCreacionStr) {
            const fc = new Date(fechaCreacionStr);
            if (!isNaN(fc)) {
                dateObj = fc;
            } else {
                const parts = fechaCreacionStr.split('/');
                if (parts.length === 3) {
                    dateObj = new Date(parts[2], parts[1]-1, parts[0]);
                }
            }
        }

        if (dateObj && !isNaN(dateObj)) {
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            month = monthNames[dateObj.getMonth()];
            year = dateObj.getFullYear();
        }

        rawDatos.push({
            producto: productCode,
            cliente: company || 'SIN EMPRESA',
            year: year,
            month: month,
            monthIndex: dateObj && !isNaN(dateObj) ? dateObj.getMonth() : -1
        });
    }
});

const rawRestricciones = [];
restriccionesLegales.forEach(row => {
    const restriction = row['NOMBRE RESTRICCIÓN'] || row['NOMBRE RESTRICCIÃ“N'];
    const product = row['CÓDIGO DE PRODUCTO'] || row['CÃ“DIGO DE PRODUCTO'];
    
    if (restriction && product) {
        rawRestricciones.push({
            producto: product,
            restriccion: restriction
        });
    }
});

const output = {
    datos: rawDatos,
    restricciones: rawRestricciones
};

const jsContent = `window.CLASIFICACION_RAW_DATA = ${JSON.stringify(output)};\n`;
fs.writeFileSync('js/data_clasificacion.js', jsContent);
console.log('Successfully generated raw js/data_clasificacion.js');
