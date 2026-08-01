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
  const [prefillData, setPrefillData] = useState(null); // { nome, ano, tipo }
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
          setPrefillData={setPrefillData}
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
          prefillData={prefillData}
          goTo={goTo}
          onDone={(mensagem) => { setConfirmData(buildConfirm(mensagem)); goTo('confirm'); }}
        />
      )}
      {screen === 'confirm' && confirmData && (
        <ConfirmScreen data={confirmData} goTo={goTo} />
      )}
      {screen === 'sheet' && <SheetScreen currentUser={currentUser} goTo={goTo} onPickExisting={(m) => { setSelected(m); goTo('rate'); }} />}
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
        <button className="cta-primary" onClick={() => goTo('sheet')}>📋 Ver filmes / avaliar</button>
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
function SearchScreen({ currentUser, goTo, onPickExisting, onNotFound, setPrefillData }) {
  const [nome, setNome] = useState('');
  const [ano, setAno] = useState('');
  const [tipo, setTipo] = useState('F');
  const [imdbMatches, setImdbMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  async function verificarNoImdb() {
    if (!nome.trim() || !ano.trim()) {
      setError('Preencha nome e ano');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const { data } = await api('/api/imdb-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, ano: parseInt(ano, 10), tipo }),
      });
      setImdbMatches(data.matches || []);
      setSearched(true);
    } catch (err) {
      setError(err.message);
      setImdbMatches([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  function irParaCadastro(filme) {
    if (filme.existsInClub) {
      // Se já existe, vai avaliar
      onPickExisting({ rowNumber: filme.rowNumber, nome: filme.nome, tipo: filme.tipo, ano: filme.ano, imdbLink: `https://www.imdb.com/title/${filme.imdbId}/` });
    } else {
      // Se não existe, vai cadastrar com dados do IMDb preenchidos (já validados na Tela 1)
      setPrefillData({ nome: filme.nome, ano: parseInt(filme.ano, 10), tipo: filme.tipo, imdbId: filme.imdbId, imdbRating: filme.imdbRating });
      goTo('new');
    }
  }

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
          <input type="text" placeholder="Digite o nome..." value={nome} onChange={e => setNome(e.target.value)} />
        </div>

        <div className="field">
          <label>ANO</label>
          <input type="text" placeholder="Ex: 2024" value={ano} onChange={e => {
            const val = e.target.value;
            // Só aceita números, máximo 4 dígitos
            if (/^\d{0,4}$/.test(val)) {
              setAno(val);
            }
          }} maxLength="4" />
          {ano && ano.length === 4 && (isNaN(parseInt(ano, 10)) || parseInt(ano, 10) < 1900 || parseInt(ano, 10) > 2027) && (
            <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>Ano deve estar entre 1900 e 2027</p>
          )}
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

        {error && <div className="status-banner status-error" style={{ display: 'block' }}>{error}</div>}

        <button className="cta-primary" onClick={verificarNoImdb} disabled={searching || !nome.trim() || !ano.trim()}>
          {searching ? 'Verificando...' : 'Verificar no IMDb'}
        </button>

        {searched && imdbMatches.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 12 }}>✅ Encontramos no IMDb:</p>
            {imdbMatches.map((m, i) => (
              <div key={i} className="choice-card" style={{ padding: 12, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <a href={`https://www.imdb.com/title/${m.imdbId}/`} target="_blank" rel="noopener" style={{ color: '#5B9FD9', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                    {m.nome} <span style={{ fontSize: 11 }}>↗</span>
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {typeLabel(m.tipo)} · {m.ano} {m.existsInClub && '· Já no clube'} {m.imdbRating && `· IMDb ${m.imdbRating}`}
                  </div>
                </div>
                <button className="link-btn" onClick={() => irParaCadastro(m)} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {m.existsInClub ? 'Avaliar' : 'Cadastrar como novo'}
                </button>
              </div>
            ))}
          </div>
        )}

        {searched && imdbMatches.length === 0 && (
          <div className="choice-card" style={{ padding: 12, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>
                ❌ Não encontramos
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {typeLabel(tipo)} · {ano}
              </div>
            </div>
            <button className="link-btn" onClick={() => {
              // Não encontrou nada, cadastra sem imdbId
              // Usa imdbId: null pra indicar "já validado, não encontrado"
              setPrefillData({ nome: nome.trim(), ano: parseInt(ano, 10), tipo, imdbId: null, imdbRating: null });
              onNotFound(nome.trim());
            }} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              Cadastrar como novo sem IMDb
            </button>
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
function NewScreen({ currentUser, prefill, prefillData, goTo, onDone }) {
  const [nome, setNome] = useState(prefillData?.nome || prefill || '');
  const [tipo, setTipo] = useState(prefillData?.tipo || 'F');
  const [ano, setAno] = useState(prefillData?.ano ? String(prefillData.ano) : '');
  const [ondeVer, setOndeVer] = useState('');
  const [nota, setNota] = useState(3.5);
  const [stage, setStage] = useState('form'); // form | validating | resultado | duplicate | confirmando
  const [validatingMsg] = useState('Conferindo no IMDb...');
  const [errorInfo, setErrorInfo] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [dupInfo, setDupInfo] = useState(null);

  useEffect(() => {
    if (prefillData) {
      setNome(prefillData.nome || '');
      setTipo(prefillData.tipo || 'F');
      setAno(prefillData.ano ? String(prefillData.ano) : '');
    }
  }, [prefillData]);

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
        body: JSON.stringify({ nome, tipo, ano: parseInt(ano, 10), ondeVer, pessoa: currentUser, nota, imdbId: prefillData?.imdbId, imdbRating: prefillData?.imdbRating }),
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
              Não achamos <strong style={{ color: 'var(--text)' }}>{nome}</strong> como <strong>{typeLabel(tipo)}</strong> de <strong>{ano}</strong> no IMDb.
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
        <button className="cta-primary" onClick={() => { prefillData?.imdbId !== undefined ? confirmAndSave() : validate(); }} disabled={!nome || !ano}>
          Cadastrar
        </button>
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
function SheetScreen({ currentUser, goTo, onPickExisting }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [sort, setSort] = useState('nome');
  const [view, setView] = useState('todos'); // 'todos' ou 'fila'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        tipo: view === 'fila' ? 'todos' : tipo, // ignora filtro tipo na fila
        sort: view === 'fila' ? 'imdb' : sort, // força ordenar por IMDb na fila
        view: view, // passa o tipo de view
        currentUser: currentUser || ''
      });
      api(`/api/sheet?${params.toString()}`)
        .then(({ data }) => setItems(data.items || []))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, tipo, sort, view, currentUser]);

  function pickFilter(f) { setTipo(f); setSort('nome'); }

  return (
    <div className="screen">
      <div className="back-row"><button className="back-btn" onClick={() => goTo('home')}>←</button></div>
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12 }}>
        <p className="eyebrow">{view === 'fila' ? 'Para avaliar' : 'Todos os filmes'}</p>
        <h1>{view === 'fila' ? `Filmes sem nota - ${currentUser}` : view === 'discutidos' ? 'Filmes Discutidos' : 'Ver filmes/séries'}</h1>
      </div>
      <div className="content">
        {/* Abas: Todos vs Fila */}
        <div className="filter-row" style={{ marginBottom: 12 }}>
          <button className={`filter-chip${view === 'todos' ? ' active' : ''}`} onClick={() => { setView('todos'); setTipo('todos'); }}>Todos</button>
          <button className={`filter-chip${view === 'discutidos' ? ' active' : ''}`} onClick={() => setView('discutidos')}>Discutidos</button>
          <button className={`filter-chip${view === 'fila' ? ' active' : ''}`} onClick={() => setView('fila')}>Sem nota - {currentUser}</button>
        </div>

        <input type="text" placeholder="Buscar título..." value={query} onChange={e => setQuery(e.target.value)} />

        {view === 'todos' && (
          <div className="filter-row">
            <button className={`filter-chip${tipo === 'F' ? ' active' : ''}`} onClick={() => pickFilter('F')}>Filmes</button>
            <button className={`filter-chip${tipo === 'S' ? ' active' : ''}`} onClick={() => pickFilter('S')}>Séries</button>
          </div>
        )}

        {view === 'todos' && (
          <div className="filter-row" style={{ marginTop: 8 }}>
            <span style={{ color: 'var(--muted)', fontSize: 11, alignSelf: 'center' }}>ORDENAR:</span>
            <button className={`filter-chip${sort === 'imdb' ? ' active' : ''}`} onClick={() => setSort('imdb')}>Nota IMDb</button>
            <button className={`filter-chip${sort === 'media' ? ' active' : ''}`} onClick={() => setSort('media')}>Média Pond.</button>
          </div>
        )}

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}

        {items.map((m, i) => {
          const hasMultipleVotes = m.votos > 1;

          // Número grande conforme a ordenação
          let bigNumber;
          let metaExtra = '';

          if (view === 'fila') {
            // Fila: número é IMDb, mas só mostra se votos > 1 (igual a "Ordenar por IMDb")
            bigNumber = hasMultipleVotes && m.imdbNota ? formatNota(m.imdbNota) : '—';
            metaExtra = m.mediaPond != null ? ` · média pond. ${formatNota(m.mediaPond)}` : '';
          } else if (sort === 'media') {
            // Ordenado por Média Ponderada: número é Média, meta é IMDb (se votos > 1)
            bigNumber = m.mediaPond != null ? formatNota(m.mediaPond) : '—';
            metaExtra = hasMultipleVotes && m.imdbNota ? ` · IMDb ${formatNota(m.imdbNota)}` : '';
          } else if (sort === 'imdb' || view === 'todos') {
            // Ordenado por IMDb ou view normal: número é IMDb, meta é Média
            bigNumber = m.imdbNota ? formatNota(m.imdbNota) : '—';
            metaExtra = sort === 'nome' ? '' : (m.mediaPond != null ? ` · média pond. ${formatNota(m.mediaPond)}` : '');
          }
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
                    {typeLabel(m.tipo)} · {m.ano} · {m.votos} aval.{m.discutido ? ' · D' : ''}{metaExtra}
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
