const fs = require('fs');
const content = fs.readFileSync('js/default_data.js', 'utf8');
const match = content.match(/"vuceRegistros":(\[.*?\])\}\}/);
if (match) {
   const data = JSON.parse(match[1]);
   console.log('vuceRegistros length:', data.length);
   console.log('Row 0:', data[0]);
   console.log('Row 1:', data[1]);
} else {
   console.log('No vuceRegistros found');
}
