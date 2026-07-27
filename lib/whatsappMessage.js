// lib/whatsappMessage.js
// Formato validado com o usuário ao longo do projeto:
//   "{Pessoa}: #{Número} - {Título} - {Tipo} - {Ano} - {Nota} (Existente|Novo|Novo - não confirmado)"
// e, quando corrigido via TMDb: "... [corrigido de: "{digitado}" - {ano digitado}]"

function formatNota(nota) {
  // Notas usam vírgula (padrão brasileiro), ex: 4.5 -> "4,5"
  return Number(nota).toFixed(1).replace('.', ',');
}

function buildMessage({ pessoa, numero, titulo, tipo, ano, nota, status, correctedFrom }) {
  const statusLabel = {
    existente: 'Existente',
    novo: 'Novo',
    novo_nao_confirmado: 'Novo - não confirmado',
  }[status];
  if (!statusLabel) throw new Error(`status desconhecido: ${status}`);

  let msg = `${pessoa}: #${numero} - ${titulo} - ${tipo} - ${ano} - ${formatNota(nota)} (${statusLabel})`;
  if (correctedFrom) {
    msg += ` [corrigido de: "${correctedFrom.nome}" - ${correctedFrom.ano}]`;
  }
  return msg;
}

module.exports = { buildMessage, formatNota };
