const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { sendHtml, sendJson } = require('./http');
const { readCsv, appendCsvRecord } = require('./csvStore');
const { ROOT } = require('./config');

function createRequestHandler() {
  return (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && parsedUrl.pathname === '/') {
      const htmlPath = path.join(ROOT, 'public', 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      sendHtml(res, html);
      return;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/src/reactApp.js') {
      const appPath = path.join(ROOT, 'src', 'reactApp.js');
      const appSource = fs.readFileSync(appPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(appSource);
      return;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/csv') {
      const contents = readCsv();
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8' });
      res.end(contents);
      return;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api') {
      sendJson(res, {
        success: true,
        message: 'API call succeeded.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/etrade/positions') {
      handleEtradePositions(res);
      return;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/save') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const { firstName, lastName } = JSON.parse(body);
          appendCsvRecord(firstName, lastName);
          sendJson(res, { success: true, message: 'Record saved successfully.' });
        } catch (error) {
          sendJson(res, { success: false, message: 'Failed to save.' });
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  };
}

function handleEtradePositions(res) {
  const accessToken = process.env.ETRADE_ACCESS_TOKEN;
  const accountId = process.env.ETRADE_ACCOUNT_ID || '712226569';
  const consumerKey = process.env.ETRADE_CONSUMER_KEY || process.env.ETRADE_API_KEY || '9fcc989adbc5a8026d69b52e3536988c';

  if (!accessToken || !accountId) {
    sendJson(res, {
      success: false,
      message: 'E*TRADE credentials are not configured. Set ETRADE_ACCESS_TOKEN and ETRADE_ACCOUNT_ID environment variables.'
    });
    return;
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'Consumer-Key': consumerKey || ''
  };

  fetch(`https://api.etrade.com/v1/accounts/${accountId}/positions`, { headers })
    .then(async (response) => {
      const text = await response.text();
      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        data = { raw: text };
      }

      if (!response.ok) {
        sendJson(res, {
          success: false,
          status: response.status,
          message: 'E*TRADE request failed.',
          data
        });
        return;
      }

      sendJson(res, { success: true, message: 'Loaded E*TRADE positions.', data });
    })
    .catch((error) => {
      sendJson(res, {
        success: false,
        message: 'Unable to reach E*TRADE.',
        error: error.message
      });
    });
}

module.exports = {
  createRequestHandler
};
