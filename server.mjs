import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.md':'text/plain', '.svg':'image/svg+xml'};
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root)) {res.writeHead(403).end('Forbidden'); return;}
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type':(types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control':'no-store'}).end(data);
  } catch {res.writeHead(404).end('Not found');}
});
server.listen(5184,'127.0.0.1',()=>console.log('Fruit Fly Fruit Ninja: http://127.0.0.1:5184'));
server.on('error',err=>{console.error(err.code==='EADDRINUSE' ? 'Port 5184 is already in use. Open the running demo or stop that process first.' : err);process.exitCode=1;});
