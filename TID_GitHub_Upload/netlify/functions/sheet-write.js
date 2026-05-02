const https = require('https');
const url = require('url');

exports.handler = async function(event, context) {
  const params = event.queryStringParameters || {};
  const action = params.action || '';
  const data = params.data || '';
  
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbz0fnY4jNYE0wwsZz6LP0x_iStY5jDYpl_ul1BKfPmTCRgSzzbV9i9Gs3cMEupVuHzUoA/exec?action=' + encodeURIComponent(action) + 
                    (data ? '&data=' + encodeURIComponent(data) : '');

  function fetchUrl(targetUrl, redirectCount) {
    return new Promise((resolve, reject) => {
      if (redirectCount > 10) { reject(new Error('Too many redirects')); return; }
      
      const parsed = url.parse(targetUrl);
      const options = {
        hostname: parsed.hostname,
        path: parsed.path,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json, text/plain, */*'
        }
      };
      
      https.get(options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          const location = res.headers.location;
          res.resume();
          fetchUrl(location, redirectCount + 1).then(resolve).catch(reject);
          return;
        }
        
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }).on('error', reject);
    });
  }
  
  try {
    const result = await fetchUrl(scriptUrl, 0);
    let parsed;
    try { parsed = JSON.parse(result.body); }
    catch(e) { parsed = { success: true, raw: result.body.slice(0,100) }; }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(parsed)
    };
  } catch(err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
