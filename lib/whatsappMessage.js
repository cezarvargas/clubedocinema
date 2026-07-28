// lib/whatsappMessage.js
// Formato:
//   "{Pessoa}: {Título} (link) - {Tipo} - {Ano} - {Nota} - {Onde viu} (Status)"
// Onde viu aparece apenas se for novo/novo_nao_confirmado
// e, quando corrigido via TMDb: "... [corrigido de: "{digitado}" - {ano digitado}]"

function formatNota(nota) {
  // Notas usam vírgula (padrão brasileiro), ex: 4.5 -> "4,5"
  return Number(nota).toFixed(1).replace('.', ',');
}

function buildMessage({ pessoa, titulo, tipo, ano, nota, status, correctedFrom, imdbLink, ondeVer }) {
  const statusLabel = {
    existente: 'Existente',
    novo: 'Novo',
    novo_nao_confirmado: 'Novo - não confirmado',
  }[status];
  if (!statusLabel) throw new Error(`status desconhecido: ${status}`);

  let msg = `${titulo} - ${tipo} - ${ano} - ${formatNota(nota)}`;

  if ((status === 'novo' || status === 'novo_nao_confirmado') && ondeVer) {
    msg += ` - ${ondeVer}`;
  }

  msg += ` (${statusLabel})`;

  if (correctedFrom && (correctedFrom.nome !== titulo || correctedFrom.ano !== ano)) {
    msg += ` [corrigido de: "${correctedFrom.nome}" - ${correctedFrom.ano}]`;
  }
  return msg;
}

module.exports = { buildMessage, formatNota };
