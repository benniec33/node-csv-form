const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;
const ROOT = __dirname;
const CSV_FILE = path.join(ROOT, 'data.csv');

if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, 'first_name,last_name\n');
}

function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendJson(res, payload) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Name Saver</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 40px auto; }
    form { display: flex; flex-direction: column; gap: 10px; }
    input { padding: 8px; }
    button { padding: 10px; cursor: pointer; }
    .message { margin-top: 12px; color: green; }
    .actions { margin-top: 12px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Save a Name</h1>
  <form id="nameForm">
    <input type="text" name="firstName" placeholder="First name here" required />
    <input type="text" name="lastName" placeholder="Last name here" required />
    <button type="submit">Save</button>
  </form>
  <div class="actions">
    <button id="showCsvButton" type="button">Show CSV Contents</button>
    <button id="callApiButton" type="button">Call API</button>
    <button id="etradePositionsButton" type="button">Load E*TRADE Positions</button>
  </div>
  <div id="message" class="message"></div>
  <pre id="csvContents">No data yet.</pre>
  <pre id="apiResult">No API result yet.</pre>
  <pre id="etradeResult">No E*TRADE result yet.</pre>

  <script>
    const form = document.getElementById('nameForm');
    const message = document.getElementById('message');
    const showCsvButton = document.getElementById('showCsvButton');
    const callApiButton = document.getElementById('callApiButton');
    const etradePositionsButton = document.getElementById('etradePositionsButton');
    const csvContents = document.getElementById('csvContents');
    const apiResult = document.getElementById('apiResult');
    const etradeResult = document.getElementById('etradeResult');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim()
      };

      const response = await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      message.textContent = result.message;
      form.reset();
    });

    showCsvButton.addEventListener('click', async () => {
      const response = await fetch('/csv');
      const text = await response.text();
      csvContents.textContent = text || 'No data yet.';
    });

    callApiButton.addEventListener('click', async () => {
      const response = await fetch('/api');
      const result = await response.json();
      apiResult.textContent = JSON.stringify(result, null, 2);
    });

    etradePositionsButton.addEventListener('click', async () => {
      const response = await fetch('/etrade/positions');
      const result = await response.json();
      etradeResult.textContent = JSON.stringify(result, null, 2);
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    sendHtml(res, html);
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/csv') {
    const contents = fs.readFileSync(CSV_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8' });
    res.end(contents);
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api') {
    sendJson(res, { success: true, message: 'API call succeeded.', timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/etrade/positions') {
    const accessToken = process.env.ETRADE_ACCESS_TOKEN;
    const accountId = process.env.ETRADE_ACCOUNT_ID;
    const consumerKey = process.env.ETRADE_CONSUMER_KEY || process.env.ETRADE_API_KEY;

    if (!accessToken || !accountId) {
      sendJson(res, {
        success: false,
        message: 'E*TRADE credentials are not configured. Set ETRADE_ACCESS_TOKEN and ETRADE_ACCOUNT_ID environment variables.'
      });
      return;
    }

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
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
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/save') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { firstName, lastName } = JSON.parse(body);
        const line = `${firstName},${lastName}\n`;
        fs.appendFileSync(CSV_FILE, line);
        sendJson(res, { success: true, message: 'Record saved successfully.' });
      } catch (error) {
        sendJson(res, { success: false, message: 'Failed to save.' });
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
