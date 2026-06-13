const https = require('https');
const http = require('http');

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS,PUT,DELETE','Access-Control-Allow-Headers':'*'});
    res.end();
    return;
  }
  const targetHost = req.headers['x-target-host'] || 'munowatch.org';
  const headers = {...req.headers};
  delete headers['x-target-host'];
  delete headers['host'];
  delete headers['connection'];
  const options = {
    hostname: targetHost, port: 443,
    path: req.url, method: req.method,
    headers: {...headers, host: targetHost}
  };
  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    const proxy = https.request(options, r => {
      const h = {...r.headers, 'access-control-allow-origin':'*', 'access-control-allow-credentials':'true'};
      delete h['transfer-encoding'];
      res.writeHead(r.statusCode, h);
      r.pipe(res);
    });
    proxy.on('error', e => { res.writeHead(500); res.end(e.message); });
    if (body.length) proxy.write(Buffer.concat(body));
    proxy.end();
  });
}).listen(process.env.PORT || 8080, () => console.log('Proxy running'));
