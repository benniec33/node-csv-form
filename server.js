const http = require('http');
const { PORT } = require('./src/config');
const { ensureCsvFile } = require('./src/csvStore');
const { createRequestHandler } = require('./src/routes');

ensureCsvFile();

const requestHandler = createRequestHandler();
const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
