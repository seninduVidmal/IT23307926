const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function loadTestCases(filePath = path.join(__dirname, '../data/test-cases.csv')) {
  if (!fs.existsSync(filePath)) return [];

  if (filePath.endsWith('.csv')) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h] = (cols[i] || '').trim());
      return obj;
    });
  }

  if (filePath.endsWith('.xlsx')) {
    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  }

  return [];
}

module.exports = { loadTestCases };
