import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// While the site runs locally (npm run dev), the admin panel at #/admin saves straight into
// the project: the catalogue to public/products.json and uploaded photos to public/img/uploads.
// On a deployed static site these endpoints do not exist, and the admin panel falls back to
// saving in that browser plus an "Export products.json" button.
function adminSave() {
  const root = process.cwd();
  const uploads = path.join(root, 'public/img/uploads');
  const readBody = (req, limit = 25 * 1024 * 1024) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > limit) reject(new Error('Too large'));
        else chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  const send = (res, code, obj) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };
  return {
    name: 'ab-admin-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/__admin/')) return next();
        try {
          if (req.url === '/__admin/ping') return send(res, 200, { ok: true });
          if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
          const body = JSON.parse(await readBody(req));
          if (req.url === '/__admin/catalogue') {
            if (!Array.isArray(body.products)) return send(res, 400, { error: 'products must be an array' });
            fs.writeFileSync(path.join(root, 'public/products.json'), JSON.stringify({ updated: new Date().toISOString(), products: body.products }, null, 2));
            return send(res, 200, { ok: true });
          }
          if (req.url === '/__admin/upload') {
            const m = /^data:image\/(webp|png|jpeg);base64,(.+)$/.exec(body.data || '');
            const name = String(body.name || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60);
            if (!m || !name) return send(res, 400, { error: 'bad image' });
            fs.mkdirSync(uploads, { recursive: true });
            const file = `${name}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
            fs.writeFileSync(path.join(uploads, file), Buffer.from(m[2], 'base64'));
            return send(res, 200, { url: `/img/uploads/${file}` });
          }
          send(res, 404, { error: 'unknown' });
        } catch (e) {
          send(res, 500, { error: String(e.message || e) });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [adminSave()],
  build: { chunkSizeWarningLimit: 900 },
});
