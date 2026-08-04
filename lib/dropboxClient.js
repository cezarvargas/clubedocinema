// lib/dropboxClient.js
// Fala direto com a API HTTP do Dropbox (em vez do SDK oficial) para baixar
// e subir o arquivo. Motivo: o SDK "dropbox" tem um histórico antigo e
// conhecido de bugs na hora de converter a resposta em binário no Node.js.
// Fazendo a chamada HTTP nós mesmos, com o fetch nativo do Node, temos
// controle total e evitamos essa armadilha.
//
// Autenticação: usa REFRESH TOKEN (permanente). O app pede um access
// token novo automaticamente sempre que precisa (dura ~4h), sem nenhuma
// ação manual. Ver scripts/get-dropbox-refresh-token.js para gerar o
// refresh token uma única vez.
//
// OBS sobre Vercel (serverless): o cache em memória abaixo não persiste
// de forma garantida entre chamadas (cada uma pode cair num servidor
// diferente) — isso é esperado e sem problema no nosso volume de uso
// (13 pessoas): na pior das hipóteses, o token é renovado com mais
// frequência do que o estritamente necessário, nunca quebra.

const FILE_PATH = `/${process.env.DROPBOX_FILE_NAME || 'ClubeDoCinema.xlsx'}`;

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 60_000) {
    return cachedToken; // ainda válido (com 1 min de folga)
  }

  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  if (!refreshToken || !appKey || !appSecret) {
    throw new Error(
      'DROPBOX_REFRESH_TOKEN / DROPBOX_APP_KEY / DROPBOX_APP_SECRET não configurados (.env.local). ' +
      'Rode "node scripts/get-dropbox-refresh-token.js" para gerar essas 3 chaves uma única vez.'
    );
  }

  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Dropbox: falha ao renovar o token (${res.status}): ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + (data.expires_in || 14400) * 1000;
  return cachedToken;
}

async function downloadSheet() {
  console.log(`[Dropbox] 📥 Baixando: ${FILE_PATH}`);
  console.log(`[Dropbox] DEBUG: DROPBOX_FOLDER="${process.env.DROPBOX_FOLDER}", DROPBOX_FILE_NAME="${process.env.DROPBOX_FILE_NAME}"`);
  const accessToken = await getAccessToken();
  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: FILE_PATH }),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[Dropbox] ❌ Erro ${res.status}: ${errText}`);
    if (res.status === 409) {
      throw new Error(`A planilha não foi encontrada. Fale com o administrador do aplicativo!`);
    }
    throw new Error(`Erro ao conectar com o Dropbox (${res.status}). Fale com o administrador do aplicativo!`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadSheet(buffer) {
  console.log(`[Dropbox] 📤 Salvando arquivo: ${FILE_PATH}`);
  const accessToken = await getAccessToken();
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: FILE_PATH, mode: 'overwrite' }),
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[Dropbox] ❌ Erro ao salvar: ${res.status} - ${errText}`);
    throw new Error(`Dropbox: falha ao salvar a planilha (${res.status}): ${errText}`);
  }
  console.log(`[Dropbox] ✅ Arquivo salvo com sucesso!`);
}

module.exports = { downloadSheet, uploadSheet, FILE_PATH };
