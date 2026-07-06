function getHtml() {
  return `<!DOCTYPE html>
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
}

module.exports = {
  getHtml
};
