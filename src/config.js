const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.resolve(__dirname, '..');
const CSV_FILE = path.join(ROOT, 'data.csv');

module.exports = {
  PORT,
  ROOT,
  CSV_FILE
};
