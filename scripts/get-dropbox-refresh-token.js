#!/usr/bin/env node
// scripts/get-dropbox-refresh-token.js
//
// Versao 2 - simplificada, baseada na pesquisa feita sobre o erro
// "invalid_app"/"invalid client_id" que batemos antes. A causa mais
// provavel nao era um bug da plataforma, e sim a URL de autorizacao
// complicada demais (com redirect_uri e outros parametros). Esta versao
// usa a URL MINIMA recomendada: sem redirect_uri, sem scope -- o Dropbox
// mostra o codigo de autorizacao direto na tela pra copiar, em vez de
// precisar de um servidor local escutando uma porta.
//
// Rode isso UMA VEZ SO (node scripts/get-dropbox-refresh-token.js) pra obter
// um refresh token permanente do Dropbox.

const readline = require('readline');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  console.log('=== Configuração do Dropbox (refresh token permanente) — v2, URL simplificada ===\n');
  const clientId = await ask('Cole a "Chave do aplicativo" (App key): ');
  const clientSecret = await ask('Cole o "Segredo do aplicativo" (App secret): ');

  // URL MINIMA de propósito: sem redirect_uri, sem scope. Isso evita os
  // motivos mais comuns do erro "invalid_app" (redirect_uri que não bate
  // exatamente com o cadastrado, ou parâmetro extra/errado).
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=code&token_access_type=offline`;

  console.log('\nAbra esse link no navegador e clique em "Permitir":\n');
  console.log(authUrl);
  console.log('\nO Dropbox vai mostrar um CÓDIGO na própria tela (não redireciona pra lugar nenhum).');

  const code = await ask('\nCole aqui o código que apareceu na tela do Dropbox: ');

  console.log('\nTrocando o código pelo token final...');

  // IMPORTANTE: como a autorização NÃO usou redirect_uri, a troca do
  // código também não pode incluir redirect_uri (tem que bater com o
  // que foi usado no passo anterior, e nesse caso foi "nenhum").
  const tokenRes = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.refresh_token) {
    console.error('\nAlgo deu errado:', JSON.stringify(tokenData, null, 2));
    process.exit(1);
  }

  console.log('\n✅ Sucesso! Copie estas 3 linhas para o seu .env.local:\n');
  console.log(`DROPBOX_APP_KEY=${clientId}`);
  console.log(`DROPBOX_APP_SECRET=${clientSecret}`);
  console.log(`DROPBOX_REFRESH_TOKEN=${tokenData.refresh_token}`);
  console.log('\n(Pode apagar a linha antiga DROPBOX_ACCESS_TOKEN= — não é mais usada.)');
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });
