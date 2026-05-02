const https = require('https');

exports.handler = async function(event, context) {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7CLnkTZN9h0pfq5aUcboa4Pv0XQmeBLcRCs_mxM7oVOCJuJWzE6dx4xFTlgiSMyc-zP0O-cKvSFs0/pub?gid=255690353&single=true&output=csv';
  
  function fetchUrl(url, redirectCount) {
    return new Promise((resolve, reject) => {
      if (redirectCount > 5) { reject(new Error('Too many redirects')); return; }
      
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache'
        }
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          fetchUrl(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
          res.resume();
          return;
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }).on('error', reject);
    });
  }
  
  try {
    const result = await fetchUrl(csvUrl, 0);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store'
      },
      body: result.body
    };
  } catch(err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
