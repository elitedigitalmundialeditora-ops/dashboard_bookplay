import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8080;
const HOST = '0.0.0.0'; // Permite conexões de qualquer dispositivo na rede local

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/**
 * Valida se o endereço IP do cliente pertence à rede interna corporativa / intranet
 * (RFC 1918 + loopback)
 */
function isRedeEmpresa(rawIp) {
  if (!rawIp) return false;
  let ip = rawIp.trim();

  // IPv6 mapeado para IPv4 (ex: ::ffff:192.168.140.50)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Loopback / máquina local
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }

  // Rede privada Classe A: 10.0.0.0 - 10.255.255.255
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return true;
  }

  // Rede privada Classe B: 172.16.0.0 - 172.31.255.255
  const bMatch = ip.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (bMatch) {
    const octet = parseInt(bMatch[1], 10);
    if (octet >= 16 && octet <= 31) return true;
  }

  // Rede privada Classe C: 192.168.0.0 - 192.168.255.255 (cobre 192.168.140.x)
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return true;
  }

  return false;
}

const server = http.createServer((req, res) => {
  // Extrai o IP do cliente (direto ou via proxy reverso)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '';

  // 1. SEGURANÇA: Bloqueio de acessos fora da rede interna da empresa
  if (!isRedeEmpresa(clientIp)) {
    console.warn(`[SEGURANÇA] Acesso bloqueado para IP externo: ${clientIp} na URL: ${req.url}`);
    res.writeHead(403, {
      'Content-Type': 'text/html; charset=UTF-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    });
    res.end(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Acesso Bloqueado | Rede Corporativa</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #07192F; color: #E2E8F0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #0E294B; border: 1px solid #DC2626; border-radius: 16px; max-width: 480px; width: 100%; padding: 40px 30px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .icon { font-size: 54px; margin-bottom: 16px; }
    h1 { font-size: 1.4rem; color: #EF4444; margin: 0 0 12px 0; font-weight: 700; }
    p { color: #CBD5E1; font-size: 0.95rem; line-height: 1.6; margin: 0 0 20px 0; }
    .ip-box { background: rgba(220, 38, 38, 0.15); border: 1px dashed #EF4444; border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: 0.9rem; color: #FCA5A5; margin-bottom: 20px; }
    .footer { font-size: 0.8rem; color: #94A3B8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>Acesso Restrito à Empresa</h1>
    <p>O acesso ao sistema de <strong>Metas & Resultados</strong> é permitido <strong>exclusivamente</strong> a partir da rede interna da empresa (intranet corporativa).</p>
    <div class="ip-box">IP Detectado: ${clientIp || 'Desconhecido'}</div>
    <div class="footer">Conecte-se à rede Wi-Fi/cabo da empresa para acessar o sistema.</div>
  </div>
</body>
</html>`);
    return;
  }

  // 2. Trata e normaliza o caminho do arquivo
  let safePath = path.normalize(req.url.split('?')[0]);
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  // Bloqueio de arquivos confidenciais/sensíveis (.env, .git, package.json, server.js, node_modules)
  const lowerPath = safePath.toLowerCase();
  if (
    lowerPath.includes('/.') ||
    lowerPath.startsWith('\\.') ||
    lowerPath.includes('package') ||
    lowerPath.includes('server.js') ||
    lowerPath.includes('vite.config') ||
    lowerPath.includes('node_modules')
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Acesso Negado');
    return;
  }

  const filePath = path.join(__dirname, safePath);

  // Segurança: impede sair do diretório raiz (Directory Traversal)
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Acesso Negado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Arquivo não encontrado: ' + safePath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Headers de segurança e controle de cache
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(' SERVIDOR WEB ATIVO COM PROTEÇÃO DE REDE CORPORATIVA');
  console.log('====================================================');
  console.log(` Acesso local: http://localhost:${PORT}`);
  console.log(` Acesso rede interna da empresa: 👉 http://192.168.140.110:${PORT}`);
  console.log(' Filtro de rede: IPs externos bloqueados automaticamente');
  console.log('====================================================');
});
