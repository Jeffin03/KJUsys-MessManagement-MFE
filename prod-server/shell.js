const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const expressStaticGzip = require('express-static-gzip');
const { setStaticCacheHeaders } = require('./cacheHeaders');

const app = express();
const port = 4200;

app.use(
  cors({
    credentials: true,
    'Access-Control-Allow-Origin': '*',
    origin: '*',
  })
);

const distPath = path.join(__dirname.split('/prod-server')[0], '/dist/shell');

// Serve static files with long-lived cache for hashed assets only.
// Stable entry files such as index.html and remoteEntry.js must revalidate on deploy.
app.use(
  '/',
  expressStaticGzip(distPath, {
    enableBrotli: false,
    serveStatic: { setHeaders: setStaticCacheHeaders },
  })
);

app.get('*/', (req, res) => {
  if (req.path.endsWith('.js')) {
    res.sendFile(path.resolve(distPath + req.path));
  } else {
    res.sendFile(path.resolve(distPath, 'index.html'));
  }
});

// Start the server
const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => console.log(`[shell] Running on port 4200`));

// Prevent 502s when behind an AWS ALB or Nginx:
// ALB keepalive is 60s by default — Node must outlast it.
server.keepAliveTimeout = 65000;   // 65s > ALB's 60s
server.headersTimeout   = 66000;   // must be slightly above keepAliveTimeout
