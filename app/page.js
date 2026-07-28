'use client';
import { useState, useEffect, useCallback } from 'react';

const TYPE_INFO = {
  F: { label: 'Filme' },
  FD: { label: 'Filme Doc.' },
  S: { label: 'Série' },
  MS: { label: 'Minissérie' },
};
const AVATAR_COLORS = [
  '#C9A24B', '#7EA35A', '#5ED9B8', '#E8A93C', '#D98A93', '#E8B98C',
  '#8AB4E8', '#D98AC9', '#C9E85E', '#E85E5E', '#5EC9E8', '#B98CE8',
];
function avatarColor(index) { return AVATAR_COLORS[index % AVATAR_COLORS.length]; }

function typeLabel(t) { return (TYPE_INFO[(t || '').toUpperCase()] || {}).label || t; }
function formatNota(n) { return Number(n).toFixed(1).replace('.', ','); }

async function api(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok && res.status !== 409) throw new Error(data.error || `Erro ${res.status}`);
  return { ok: res.ok, status: res.status, data };
}

export default function App() {
  const [screen, setScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [peopleError, setPeopleError] = useState(null);

  // dados de navegação entre telas (o que a tela seguinte precisa saber)
  const [selected, setSelected] = useState(null); // título escolhido pra avaliar (existente)
  const [prefillTitle, setPrefillTitle] = useState('');
  const [confirmData, setConfirmData] = useState(null); // { mensagem, waLink }

  useEffect(() => {
    api('/api/people')
      .then(({ data }) => setPeople(data.people || []))
      .catch(err => setPeopleError(err.message))
      .finally(() => setLoadingPeople(false));
  }, []);

  function goTo(next) { setScreen(next); }
  function login(name) { setCurrentUser(name); goTo('home'); }

  if (screen === 'login') {
    return (
      <div className="app-shell">
        <Filmstrip />
        <div className="screen">
          <div className="topbar">
            <p className="eyebrow">CLUBE DO CINEMA</p>
            <h1>Quem é você?</h1>
          </div>
          <div className="content">
            {peopleError && (
              <div className="status-banner status-error" style={{ display: 'block' }}>
                Não consegui carregar a lista de pessoas: {peopleError}
              </div>
            )}
            {loadingPeople && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}
            <div className="name-grid">
              {people.map((name, i) => (
                <button key={name} className="name-chip" onClick={() => login(name)}>
                  <span className="avatar-dot" style={{ background: avatarColor(i) }}>{name[0]}</span>{name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Filmstrip />
      {screen === 'home' && (
        <HomeScreen currentUser={currentUser} goTo={goTo} onSignOut={() => { setCurrentUser(null); goTo('login'); }} onPickExisting={(m) => { setSelected(m); goTo('rate'); }} />
      )}
      {screen === 'search' && (
        <SearchScreen
          currentUser={currentUser}
          goTo={goTo}
          onPickExisting={(m) => { setSelected(m); goTo('rate'); }}
          onNotFound={(typed) => { setPrefillTitle(typed); goTo('new'); }}
        />
      )}
      {screen === 'rate' && selected && (
        <RateScreen
          currentUser={currentUser}
          match={selected}
          goTo={goTo}
          onDone={(mensagem) => { setConfirmData(buildConfirm(mensagem)); goTo('confirm'); }}
        />
      )}
      {screen === 'new' && (
        <NewScreen
          currentUser={currentUser}
          prefill={prefillTitle}
          goTo={goTo}
          onDone={(mensagem) => { setConfirmData(buildConfirm(mensagem)); goTo('confirm'); }}
        />
      )}
      {screen === 'confirm' && confirmData && (
        <ConfirmScreen data={confirmData} goTo={goTo} />
      )}
      {screen === 'sheet' && <SheetScreen goTo={goTo} onPickExisting={(m) => { setSelected(m); goTo('rate'); }} />}
    </div>
  );
}

function buildConfirm(mensagem) {
  const waLink = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  return { mensagem, waLink };
}

function Filmstrip() { return <div className="filmstrip" />; }

// ---------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------
function HomeScreen({ currentUser, goTo, onSignOut, onPickExisting }) {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    api('/api/recent?limit=10')
      .then(({ data }) => setRecent(data.items || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="eyebrow">CLUBE DO CINEMA</p>
            <h1>Olá, {currentUser}</h1>
          </div>
          <button className="signout" onClick={onSignOut}>Início</button>
        </div>
      </div>
      <div className="content">
        <button className="cta-primary" onClick={() => goTo('sheet')}>📋 Ver planilha/avaliar</button>
        <button className="cta-secondary" onClick={() => goTo('search')}>🎬 Incluir novo filme ou série</button>

        <p className="section-label">Últimos lançamentos</p>
        <p style={{ color: 'var(--muted)', fontSize: 11, margin: '-8px 0 12px' }}>
          (N) = título cadastrado nessa nota · toque para ver as notas de todos
        </p>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}
        {error && <div className="status-banner status-error" style={{ display: 'block' }}>Erro: {error}</div>}

        {recent.map((r, i) => (
          <div key={i} className="entry entry-clickable" style={{ cursor: 'pointer' }}
               onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="entry-title">
                  {r.imdbLink ? (
                    <a className="sheet-title" href={r.imdbLink} target="_blank" rel="noopener"
                       onClick={(e) => e.stopPropagation()}>
                      {r.titulo}<span className="imdb-icon">↗</span>
                    </a>
                  ) : r.titulo}
                  {r.isNew && <span className="new-tag">(N)</span>}
                </div>
                <div className="entry-meta">
                  <span className="entry-badge">{typeLabel(r.tipo).toUpperCase()}</span>{r.ano} · {r.pessoa}
                </div>
              </div>
              <div className="entry-score">{formatNota(r.nota)}</div>
            </div>
            <div className={`sheet-detail${openIndex === i ? ' open' : ''}`}>
              {Object.entries(r.scores || {}).map(([p, s]) => (
                <div className="person-score" key={p}>
                  <span className="pname">{p}</span><span className="pval">{formatNota(s)}</span>
                </div>
              ))}
              {openIndex === i && onPickExisting && (
                <button className="sheet-avaliar-btn" onClick={async () => {
                  const { data } = await api(`/api/search?q=${encodeURIComponent(r.nome || r.titulo)}&user=${encodeURIComponent(currentUser)}`);
                  const match = data.matches?.[0];
                  if (match) onPickExisting(match);
                }}>
                  AVALIAR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// SEARCH ("O que você viu?")
// ---------------------------------------------------------------------
function SearchScreen({ currentUser, goTo, onPickExisting, onNotFound }) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback((q) => {
    if (!q.trim()) { setMatches([]); setSearched(false); return; }
    api(`/api/search?q=${encodeURIComponent(q)}&user=${encodeURIComponent(currentUser)}`)
      .then(({ data }) => { setMatches(data.matches || []); setSearched(true); })
      .catch(() => { setMatches([]); setSearched(true); });
  }, [currentUser]);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 200); // pequeno debounce
    return () => clearTimeout(t);
  }, [query, runSearch]);

  return (
    <div className="screen">
      <div className="back-row"><button className="back-btn" onClick={() => goTo('home')}>←</button></div>
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12 }}>
        <p className="eyebrow">Nova avaliação</p>
        <h1>O que você viu?</h1>
      </div>
      <div className="content">
        <div className="field">
          <label>NOME DO FILME OU SÉRIE</label>
          <input
            type="text"
            placeholder="Digite o nome..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                onNotFound(query.trim());
              }
            }}
          />
        </div>

        {matches.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Filmes encontrados:</p>
            {matches.map(m => (
              <button key={m.rowNumber} className="choice-card" onClick={() => onPickExisting(m)}>
                <div style={{ width: '100%' }}>
                  {m.imdbLink ? (
                    <a href={m.imdbLink} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ color: '#5B9FD9', textDecoration: 'none', fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                      {m.nome} <span style={{ fontSize: '12px', color: 'var(--muted)' }}>↗</span>
                    </a>
                  ) : <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: 'var(--text)' }}>{m.nome}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{m.tipo === 'S' || m.tipo === 'MS' ? '📺' : '🎬'}</span>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{typeLabel(m.tipo)} · {m.ano}{m.alreadyRatedByMe ? ' · você já avaliou' : ''}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.trim() && (
          <button className="link-btn" onClick={() => onNotFound(query.trim())} style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 16 }}>
            Nenhum desses? Cadastrar "{query.trim()}" como novo
          </button>
        )}

        {searched && matches.length === 0 && (
          <div>
            <div className="status-banner status-new" style={{ display: 'block' }}>Não encontramos esse título no clube</div>
            <button className="cta-primary" onClick={() => onNotFound(query.trim())}>✨ Cadastrar como novo</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// RATE (título já existente)
// ---------------------------------------------------------------------
function RateScreen({ currentUser, match, goTo, onDone }) {
  const [nota, setNota] = useState(3.5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { data } = await api('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber: match.rowNumber, pessoa: currentUser, nota }),
      });
      onDone(data.mensagem);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <div className="back-row"><button className="back-btn" onClick={() => goTo('search')}>←</button></div>
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12 }}>
        <p className="eyebrow">Já no clube</p>
        <h1>Sua nota</h1>
      </div>
      <div className="content">
        <div className="summary-card">
          <div className="summary-title">{match.nome}</div>
          <div className="summary-meta"><span className="entry-badge">{typeLabel(match.tipo).toUpperCase()}</span>{match.ano}</div>
        </div>

        {match.alreadyRatedByMe && (
          <div className="dupe-error show">
            ⚠️ Você já avaliou este título — nota atual: <strong>{match.myScore}</strong>. Salvar de novo substitui sua nota.
          </div>
        )}

        <div className="field">
          <label>SUA NOTA</label>
          <div className="score-display"><div className="score-num">{formatNota(nota)}</div></div>
          <input type="range" min="0" max="5" step="0.5" value={nota} onChange={e => setNota(parseFloat(e.target.value))} />
        </div>

        {error && <div className="status-banner status-error" style={{ display: 'block' }}>{error}</div>}
        <button className="cta-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar nota'}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// NEW (cadastro de título novo)
// ---------------------------------------------------------------------
function NewScreen({ currentUser, prefill, goTo, onDone }) {
  const [nome, setNome] = useState(prefill || '');
  const [tipo, setTipo] = useState('F');
  const [ano, setAno] = useState('');
  const [ondeVer, setOndeVer] = useState('');
  const [nota, setNota] = useState(3.5);
  const [stage, setStage] = useState('form'); // form | validating | resultado | duplicate | confirmando
  const [validatingMsg] = useState('Conferindo no IMDb...');
  const [errorInfo, setErrorInfo] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [dupInfo, setDupInfo] = useState(null);

  async function validate() {
    setStage('validating');
    try {
      const { data } = await api('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, tipo, ano: parseInt(ano, 10) }),
      });
      setValidationResult(data);
      setStage('resultado');
    } catch (err) {
      setErrorInfo(err.message);
      setStage('form');
    }
  }

  async function confirmAndSave() {
    setStage('confirmando');
    try {
      const { status, data } = await api('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, tipo, ano: parseInt(ano, 10), ondeVer, pessoa: currentUser, nota }),
      });
      if (status === 409) {
        setDupInfo(data.existing);
        setStage('duplicate');
        return;
      }
      onDone(data.mensagem);
    } catch (err) {
      setErrorInfo(err.message);
      setStage('resultado');
    }
  }

  if (stage === 'validating') {
    return (
      <div className="screen">
        <div className="content" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div className="spinner" />
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 16 }}>{validatingMsg}</p>
        </div>
      </div>
    );
  }

  if (stage === 'resultado' && validationResult) {
    if (validationResult.found && validationResult.filme) {
      const f = validationResult.filme;
      return (
        <div className="screen">
          <div className="back-row"><button className="back-btn" onClick={() => setStage('form')}>←</button></div>
          <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12 }}>
            <p className="eyebrow">Novo no clube</p>
            <h1>✅ Encontramos no IMDb</h1>
          </div>
          <div className="content">
            <a href={`https://www.imdb.com/title/${f.imdbId}/`} target="_blank" rel="noopener"
               style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="summary-card">
                <div className="summary-title" style={{ cursor: 'pointer', color: '#6BA3FF' }}>{f.nome}<span style={{ fontSize: '0.7em', marginLeft: 4 }}>↗</span></div>
                <div className="summary-meta"><span className="entry-badge">{typeLabel(f.tipo).toUpperCase()}</span>{f.ano}</div>
                {f.imdbRating && <div className="summary-meta" style={{ marginTop: 8, fontSize: 13 }}>IMDb: {formatNota(f.imdbRating)}</div>}
              </div>
            </a>
            {errorInfo && <div className="status-banner status-error" style={{ display: 'block' }}>{errorInfo}</div>}
            <button className="cta-primary" onClick={confirmAndSave} disabled={stage === 'confirmando'}>
              {stage === 'confirmando' ? 'Salvando...' : 'Confirmar e salvar'}
            </button>
            <button className="link-btn" onClick={() => setStage('form')} style={{ fontSize: 15, fontWeight: 500 }}>Alterar</button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="screen">
          <div className="back-row"><button className="back-btn" onClick={() => setStage('form')}>←</button></div>
          <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12 }}>
            <p className="eyebrow">Novo no clube</p>
            <h1>❌ Não encontramos no IMDb</h1>
          </div>
          <div className="content">
            <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.5, marginBottom: 16 }}>
              Não achamos <strong style={{ color: 'var(--text)' }}>{nome}</strong> como <strong>{typeLabel(tipo)}</strong> de <strong>{ano}</strong> no IMDb ou TMDb.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 20 }}>
              Você pode corrigir o nome e tentar novamente, ou cadastrar assim mesmo — vai aparecer sem link, em preto e negrito.
            </p>
            {errorInfo && <div className="status-banner status-error" style={{ display: 'block' }}>{errorInfo}</div>}
            <button className="cta-primary" onClick={confirmAndSave} disabled={stage === 'confirmando'}>
              {stage === 'confirmando' ? 'Salvando...' : 'Cadastrar assim mesmo'}
            </button>
            <button className="link-btn" onClick={() => { setNome(''); setStage('form'); }}>Mudar o nome</button>
          </div>
        </div>
      );
    }
  }

  if (stage === 'duplicate' && dupInfo) {
    return (
      <div className="screen">
        <div className="content">
          <div className="status-banner status-error" style={{ display: 'block' }}>
            Esse título já existe no clube: <strong>{dupInfo.nome}</strong> ({typeLabel(dupInfo.tipo)}, {dupInfo.ano}).
          </div>
          <button className="cta-primary" onClick={() => setStage('form')}>Voltar e corrigir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="back-row"><button className="back-btn" onClick={() => goTo('search')}>←</button></div>
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12 }}>
        <p className="eyebrow">Novo no clube</p>
        <h1>Preencha os dados</h1>
      </div>
      <div className="content">
        <div className="field">
          <label>TÍTULO</label>
          <input type="text" placeholder="Nome exato do filme ou série" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div className="field">
          <label>TIPO</label>
          <div className="toggle-row">
            <button className={`toggle-btn${tipo === 'F' ? ' active' : ''}`} onClick={() => setTipo('F')}>Filme<span className="code">F</span></button>
            <button className={`toggle-btn${tipo === 'FD' ? ' active' : ''}`} onClick={() => setTipo('FD')}>Filme Doc.<span className="code">FD</span></button>
            <button className={`toggle-btn${tipo === 'S' ? ' active' : ''}`} onClick={() => setTipo('S')}>Série<span className="code">S</span></button>
            <button className={`toggle-btn${tipo === 'MS' ? ' active' : ''}`} onClick={() => setTipo('MS')}>Minissérie<span className="code">MS</span></button>
          </div>
        </div>
        <div className="field">
          <label>ANO</label>
          <input type="text" placeholder="Ex: 2024" value={ano} onChange={e => setAno(e.target.value)} maxLength="4" />
          {ano && (ano.length !== 4 || isNaN(parseInt(ano, 10)) || parseInt(ano, 10) < 1900 || parseInt(ano, 10) > 2027) && (
            <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>
              Ano deve ter 4 dígitos entre 1900 e 2027
            </p>
          )}
        </div>
        <div className="field">
          <label>ONDE VIU</label>
          <input type="text" placeholder="Ex: Netflix, cinema..." value={ondeVer} onChange={e => setOndeVer(e.target.value)} />
        </div>
        <div className="field">
          <label>SUA NOTA</label>
          <div className="score-display"><div className="score-num">{formatNota(nota)}</div></div>
          <input type="range" min="0" max="5" step="0.5" value={nota} onChange={e => setNota(parseFloat(e.target.value))} />
        </div>

        {errorInfo && <div className="status-banner status-error" style={{ display: 'block' }}>{errorInfo}</div>}
        <button className="cta-primary" onClick={validate} disabled={!nome || !ano}>Validar no IMDb</button>
        <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
          Vamos checar se o filme existe no IMDb. Depois você confirma ou ajusta o nome.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// CONFIRM (mensagem pronta pro WhatsApp)
// ---------------------------------------------------------------------
function ConfirmScreen({ data, goTo }) {
  return (
    <div className="screen">
      <div className="content" style={{ textAlign: 'center', paddingTop: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--good)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28,
        }}>✓</div>
        <div className="wa-preview" style={{ textAlign: 'left' }}>
          <div className="wa-group-name">Grupo: Clube do Cinema</div>
          <div className="wa-bubble">
            <span>{data.mensagem}</span>
            <span className="wa-time">agora</span>
          </div>
        </div>
        <a className="cta-wa" href={data.waLink} target="_blank" rel="noopener"
           style={{ display: 'flex', textDecoration: 'none' }}>
          📲 Compartilhar no grupo
        </a>
        <button className="link-btn" onClick={() => goTo('home')}>Pular, voltar ao início</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// SHEET (Ver planilha completa)
// ---------------------------------------------------------------------
function SheetScreen({ goTo, onPickExisting }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [sort, setSort] = useState('nome');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api(`/api/sheet?q=${encodeURIComponent(query)}&tipo=${tipo}&sort=${sort}`)
        .then(({ data }) => setItems(data.items || []))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, tipo, sort]);

  function pickFilter(f) { setTipo(f); setSort('nome'); }

  return (
    <div className="screen">
      <div className="back-row"><button className="back-btn" onClick={() => goTo('home')}>←</button></div>
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12 }}>
        <p className="eyebrow">Todos os filmes</p>
        <h1>Ver planilha completa</h1>
      </div>
      <div className="content">
        <input type="text" placeholder="Buscar título..." value={query} onChange={e => setQuery(e.target.value)} />
        <div className="filter-row">
          <button className={`filter-chip${tipo === 'todos' ? ' active' : ''}`} onClick={() => pickFilter('todos')}>Todos</button>
          <button className={`filter-chip${tipo === 'F' ? ' active' : ''}`} onClick={() => pickFilter('F')}>Filmes</button>
          <button className={`filter-chip${tipo === 'S' ? ' active' : ''}`} onClick={() => pickFilter('S')}>Séries</button>
        </div>
        <div className="filter-row" style={{ marginTop: 8 }}>
          <span style={{ color: 'var(--muted)', fontSize: 11, alignSelf: 'center' }}>ORDENAR:</span>
          <button className={`filter-chip${sort === 'imdb' ? ' active' : ''}`} onClick={() => setSort('imdb')}>Nota IMDb</button>
          <button className={`filter-chip${sort === 'media' ? ' active' : ''}`} onClick={() => setSort('media')}>Média Pond.</button>
        </div>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}

        {items.map((m, i) => {
          const bigNumber = sort === 'imdb' && m.imdbNota
            ? formatNota(m.imdbNota)
            : (m.mediaPond != null ? formatNota(m.mediaPond) : '—');
          const metaExtra = sort === 'imdb'
            ? (m.mediaPond != null ? ` · média pond. ${formatNota(m.mediaPond)}` : '')
            : (m.imdbNota ? ` · IMDb ${formatNota(m.imdbNota)}` : '');
          return (
            <div key={m.rowNumber} className="sheet-row">
              <div className="sheet-row-top" onClick={() => setOpenRow(openRow === i ? null : i)}>
                <div>
                  {m.imdbLink ? (
                    <a className="sheet-title" href={m.imdbLink} target="_blank" rel="noopener"
                       onClick={(e) => e.stopPropagation()}>
                      {m.nome}<span className="imdb-icon">↗</span>
                    </a>
                  ) : <div className="sheet-title unconfirmed">{m.nome}</div>}
                  <div className="sheet-meta">
                    {typeLabel(m.tipo)} · {m.ano} · {m.votos} avaliações{metaExtra}
                  </div>
                </div>
                <div className="sheet-avg">{bigNumber} <span className="chev">▾</span></div>
              </div>
              <div className={`sheet-detail${openRow === i ? ' open' : ''}`}>
                {Object.entries(m.scores || {}).map(([p, s]) => (
                  <div className="person-score" key={p}>
                    <span className="pname">{p}</span><span className="pval">{formatNota(s)}</span>
                  </div>
                ))}
                {openRow === i && onPickExisting && (
                  <button className="sheet-avaliar-btn" onClick={() => onPickExisting(m)}>
                    AVALIAR
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
