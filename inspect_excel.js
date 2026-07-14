const XLSX = require('xlsx');
const wb = XLSX.readFile('d:/Desktop/samy/KPI SIACO/REPORTE.xls');
const sheet = wb.Sheets['Indicadores'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
let count = 0;
let values = [];
for (let i = 1; i < rows.length; i++) {
    let d = rows[i][8]; // fechadelevante
    let val = rows[i][27]; // tiempoinspeccion
    let isJune = false;
    if (typeof d === 'number') {
        const date = new Date(Date.UTC(1899, 11, 30));
        date.setDate(date.getDate() + d);
        if (date.getMonth() === 5 && date.getFullYear() === 2026) isJune = true;
    } else if (typeof d === 'string' && (d.includes('-06-') || d.includes('/06/'))) {
        isJune = true;
    }
    if (isJune) {
        values.push(val);
        count++;
    }
}
console.log('Total records in June:', count);
console.log('First 20 values in AB for June:', values.slice(0, 20));
