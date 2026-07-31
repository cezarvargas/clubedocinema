'use client';
import { useState } from 'react';

export default function Home() {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('F');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  async function buscar() {
    if (!nome.trim()) {
      setErro('Digite um nome');
      return;
    }

    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, tipo }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro na busca');
        return;
      }

      if (data.encontrado) {
        setResultado(data.filme);
      } else {
        setErro('Filme não encontrado');
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '50px auto', padding: 20, fontFamily: 'Arial' }}>
      <h1>🎬 Buscar Filme</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Nome do Filme:</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Clube da Luta"
          style={{ width: '100%', padding: 10, marginTop: 5 }}
          onKeyPress={(e) => e.key === 'Enter' && buscar()}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Tipo:</label>
        <div style={{ marginTop: 10 }}>
          {['F', 'FD', 'S', 'MS'].map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              style={{
                padding: '10px 15px',
                marginRight: 10,
                backgroundColor: tipo === t ? '#007bff' : '#ddd',
                color: tipo === t ? 'white' : 'black',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={buscar}
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 16,
        }}
      >
        {loading ? 'Buscando...' : 'Buscar'}
      </button>

      {erro && (
        <div style={{ marginTop: 20, padding: 15, backgroundColor: '#ffcccc', borderRadius: 5, color: 'red' }}>
          ❌ {erro}
        </div>
      )}

      {resultado && (
        <div style={{ marginTop: 20, padding: 15, backgroundColor: '#ccffcc', borderRadius: 5 }}>
          <h3>✅ Encontrado!</h3>
          <p><strong>Título:</strong> {resultado.titulo}</p>
          <p><strong>Ano:</strong> {resultado.ano}</p>
          {resultado.imdbId && (
            <p><strong>IMDb ID:</strong> <a href={`https://www.imdb.com/title/${resultado.imdbId}/`} target="_blank">{resultado.imdbId}</a></p>
          )}
        </div>
      )}
    </div>
  );
}
