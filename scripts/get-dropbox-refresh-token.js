#!/usr/bin/env node
const http = require('http');
const url = require('url');
const { exec } = require('child_process');

const APP_KEY = 'nee8te8c31x9kc3';
const APP_SECRET = 'jvj83s9qpr84e40';
const REDIRECT_URI = 'http://localhost:8888/';

console.log('🔐 Gerando refresh token do Dropbox...\n');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const code = parsedUrl.query.code;
  const error = parsedUrl.query.error;

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`❌ Erro: ${error}`);
    console.error('❌ Autorização negada:', error);
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('❌ Nenhum código de autorização recebido');
    process.exit(1);
  }

  try {
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: APP_KEY,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(JSON.stringify(data));
    }

    const refreshToken = data.refresh_token;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <h1>✅ Sucesso!</h1>
      <p>Seu refresh token foi gerado com sucesso.</p>
      <p>Copie o token abaixo e coloque em <code>.env.local</code>:</p>
      <pre style="background:#f0f0f0;padding:10px;border-radius:5px;overflow-wrap:break-word;">
DROPBOX_REFRESH_TOKEN=${refreshToken}
      </pre>
      <p>Você pode fechar esta janela.</p>
    `);

    console.log('\n✅ Refresh token gerado com sucesso!\n');
    console.log('📋 Copie e cole em .env.local:\n');
    console.log(`DROPBOX_REFRESH_TOKEN=${refreshToken}\n`);

    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`❌ Erro ao trocar código por token: ${err.message}`);
    console.error('❌ Erro:', err);
    process.exit(1);
  }
});

server.listen(8888, () => {
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=files.content.read+files.content.write`;

  console.log('📱 Abrindo navegador para autorização...\n');
  console.log(`🔗 URL: ${authUrl}\n`);

  const commands = {
    win32: `start ${authUrl}`,
    darwin: `open ${authUrl}`,
    linux: `xdg-open ${authUrl}`,
  };

  const command = commands[process.platform];
  if (command) {
    exec(command, (err) => {
      if (err) {
        console.log('⚠️  Não consegui abrir o navegador automaticamente.');
        console.log(`Acesse manualmente: ${authUrl}\n`);
      }
    });
  } else {
    console.log(`Acesse: ${authUrl}\n`);
  }

  console.log('⏳ Aguardando autorização...\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('❌ Porta 8888 já está em uso. Feche outros programas e tente novamente.');
  } else {
    console.error('❌ Erro do servidor:', err);
  }
  process.exit(1);
});
