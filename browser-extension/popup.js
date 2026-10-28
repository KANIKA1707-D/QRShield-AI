document.addEventListener('DOMContentLoaded', () => {
  const urlSpan = document.getElementById('url');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loader = document.getElementById('loader');
  const errorDiv = document.getElementById('error');
  const resultDiv = document.getElementById('result');

  // Get current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url) {
      urlSpan.textContent = tab.url;
    } else {
      urlSpan.textContent = 'Unavailable';
    }
  });

  analyzeBtn.addEventListener('click', async () => {
    const url = urlSpan.textContent;
    if (!url || url === 'Unavailable') {
      errorDiv.textContent = 'Cannot get current URL.';
      return;
    }
    loader.style.display = 'block';
    errorDiv.textContent = '';
    resultDiv.innerHTML = '';
    try {
      const resp = await fetch('http://127.0.0.1:5000/api/analyze-url', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({url})
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || `Status ${resp.status}`);
      }
      const data = await resp.json();
      // display results
      const html = `<p><strong>Risk Score:</strong> ${data.risk_score}</p>
                    <p><strong>Risk Level:</strong> ${data.risk_level}</p>
                    <p><strong>Message:</strong> ${data.message}</p>
                    <p><strong>Indicators:</strong> ${data.indicators && data.indicators.length > 0 ? data.indicators.join(', ') : 'None'}</p>`;
      resultDiv.innerHTML = html;
    } catch (e) {
      errorDiv.textContent = e.message;
    } finally {
      loader.style.display = 'none';
    }
  });
});
