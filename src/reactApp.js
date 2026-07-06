const { useState } = React;

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');
  const [csvContents, setCsvContents] = useState('No data yet.');
  const [apiResult, setApiResult] = useState('No API result yet.');
  const [etradeResult, setEtradeResult] = useState('No E*TRADE result yet.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() })
      });

      const result = await response.json();
      setMessage(result.message || 'Saved.');
      setFirstName('');
      setLastName('');
    } catch (error) {
      setMessage('Unable to save right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadCsv = async () => {
    try {
      const response = await fetch('/csv');
      const text = await response.text();
      setCsvContents(text || 'No data yet.');
    } catch (error) {
      setCsvContents('Unable to load CSV data.');
    }
  };

  const loadApi = async () => {
    try {
      const response = await fetch('/api');
      const result = await response.json();
      setApiResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setApiResult('Unable to call API.');
    }
  };

  const loadEtrade = async () => {
    try {
      const response = await fetch('/etrade/positions');
      const result = await response.json();
      setEtradeResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setEtradeResult('Unable to load E*TRADE data.');
    }
  };

  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement('h1', null, 'Save a Name'),
    React.createElement(
      'form',
      { onSubmit: handleSubmit },
      React.createElement('input', {
        type: 'text',
        placeholder: 'First name here',
        value: firstName,
        onChange: (event) => setFirstName(event.target.value),
        required: true
      }),
      React.createElement('input', {
        type: 'text',
        placeholder: 'Last name here',
        value: lastName,
        onChange: (event) => setLastName(event.target.value),
        required: true
      }),
      React.createElement('button', { type: 'submit', disabled: isSubmitting }, isSubmitting ? 'Saving...' : 'Save')
    ),
    React.createElement(
      'div',
      { className: 'actions' },
      React.createElement('button', { type: 'button', onClick: loadCsv }, 'Show CSV Contents'),
      React.createElement('button', { type: 'button', onClick: loadApi }, 'Call API'),
      React.createElement('button', { type: 'button', onClick: loadEtrade }, 'Load E*TRADE Positions')
    ),
    message ? React.createElement('div', { className: 'message' }, message) : null,
    React.createElement('h2', null, 'CSV Contents'),
    React.createElement('pre', null, csvContents),
    React.createElement('h2', null, 'API Result'),
    React.createElement('pre', null, apiResult),
    React.createElement('h2', null, 'E*TRADE Result'),
    React.createElement('pre', null, etradeResult)
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
