// lib/whatsappMessage.js
// Formato:
//   "{Título} - {Tipo} - {Ano} - {Nota} - {Onde viu} (Status)"
// Onde viu aparece apenas se for novo/novo_nao_confirmado
// Status: (E) = Existente, (N) = Novo com IMDb, (N - sem IMDB) = Novo sem IMDb

function formatNota(nota) {
  // Notas usam vírgula (padrão brasileiro), ex: 4.5 -> "4,5"
  return Number(nota).toFixed(1).replace('.', ',');
}

function buildMessage({ pessoa, titulo, tipo, ano, nota, status, correctedFrom, imdbLink, ondeVer }) {
  let statusLabel;

  if (status === 'existente') {
    statusLabel = 'E';
  } else if (status === 'novo' || status === 'novo_nao_confirmado') {
    statusLabel = imdbLink ? 'N' : 'N - sem IMDB';
  } else {
    throw new Error(`status desconhecido: ${status}`);
  }

  let msg = `${titulo} - ${tipo} - ${ano} - ${formatNota(nota)}`;

  if ((status === 'novo' || status === 'novo_nao_confirmado') && ondeVer) {
    msg += ` - ${ondeVer}`;
  }

  msg += ` (${statusLabel})`;

  return msg;
}

module.exports = { buildMessage, formatNota };
