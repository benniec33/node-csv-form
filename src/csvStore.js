const fs = require('fs');
const { CSV_FILE } = require('./config');

function ensureCsvFile() {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'first_name,last_name\n');
  }
}

function readCsv() {
  return fs.readFileSync(CSV_FILE, 'utf8');
}

function appendCsvRecord(firstName, lastName) {
  const line = `${firstName},${lastName}\n`;
  fs.appendFileSync(CSV_FILE, line);
}

module.exports = {
  ensureCsvFile,
  readCsv,
  appendCsvRecord,
  readCsv
};
