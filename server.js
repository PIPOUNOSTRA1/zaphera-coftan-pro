const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'docs');
const PORT = 3030;

const ORDERS_FILE = path.join(__dirname, 'orders.json');

const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.css'  : 'text/css',
  '.js'   : 'application/javascript',
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.webp' : 'image/webp',
  '.mp4'  : 'video/mp4',
  '.mp3'  : 'audio/mpeg',
  '.svg'  : 'image/svg+xml',
  '.ico'  : 'image/x-icon',
  '.json' : 'application/json',
};

function getOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('Error reading orders file:', err);
  }
  return [];
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing orders file:', err);
    return false;
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // ── API Routes for Order Persistence ──
  if (urlPath.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (urlPath === '/api/orders' && req.method === 'GET') {
      const orders = getOrders();
      res.writeHead(200);
      res.end(JSON.stringify(orders));
      return;
    }

    if (urlPath === '/api/orders' && req.method === 'POST') {
      readJsonBody(req)
        .then(newOrder => {
          const orders = getOrders();
          orders.unshift(newOrder);
          saveOrders(orders);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, order: newOrder }));
        })
        .catch(err => {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        });
      return;
    }

    if (urlPath === '/api/orders/update-status' && req.method === 'POST') {
      readJsonBody(req)
        .then(body => {
          const { id, status } = body;
          const orders = getOrders();
          const order = orders.find(o => o.id === id);
          if (order) {
            order.status = status;
            saveOrders(orders);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Order not found' }));
          }
        })
        .catch(err => {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        });
      return;
    }

    if (urlPath === '/api/orders/clear' && req.method === 'POST') {
      saveOrders([]);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API Endpoint not found' }));
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: stay inside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404); res.end('Not Found'); return;
    }

    const ext      = path.extname(filePath).toLowerCase();
    const mimeType = MIME[ext] || 'application/octet-stream';
    const fileSize = stat.size;
    const rangeHdr = req.headers['range'];

    // ── Range request (needed for video seek) ──
    if (rangeHdr) {
      const parts  = rangeHdr.replace(/bytes=/, '').split('-');
      const start  = parseInt(parts[0], 10);
      const end    = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunk  = end - start + 1;

      res.writeHead(206, {
        'Content-Range'  : `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges'  : 'bytes',
        'Content-Length' : chunk,
        'Content-Type'   : mimeType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);

    } else {
      // ── Normal request ──
      res.writeHead(200, {
        'Content-Length' : fileSize,
        'Content-Type'   : mimeType,
        'Accept-Ranges'  : 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });

}).listen(PORT, () => {
  console.log(`✅ Server ready → http://localhost:${PORT}`);
});
