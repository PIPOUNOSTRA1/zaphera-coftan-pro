const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'docs');
const PORT = 3030;

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

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
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
