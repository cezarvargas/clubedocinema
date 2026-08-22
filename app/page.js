'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const TYPE_INFO = {
  F: { label: 'Filme', abbrev: 'F' },
  FD: { label: 'Filme Doc.', abbrev: 'FD' },
  S: { label: 'Série', abbrev: 'S' },
  SD: { label: 'Série Doc.', abbrev: 'SD' },
  MS: { label: 'Minissérie', abbrev: 'MS' },
  MSD: { label: 'Minissérie Doc.', abbrev: 'MSD' },
};
const AVATAR_COLORS = [
  '#C9A24B', '#7EA35A', '#5ED9B8', '#E8A93C', '#D98A93', '#E8B98C',
  '#8AB4E8', '#D98AC9', '#C9E85E', '#E85E5E', '#5EC9E8', '#B98CE8',
];
const PEOPLE_COLORS = {
  'Carmen': '#99CCFF',
  'Cezar': '#92D050',
  'Chris': '#99FFCC',
  'Cris': '#FFC000',
  'Eliane': '#DA9694',
  'Fernando': '#948A54',
  'Helena': '#FF99FF',
  'Ivanete': '#FF0000',
  'João': '#66FF33',
  'M. Ignez': '#C4BD97',
  'M.Ignez': '#C4BD97',
  'M Ignez': '#C4BD97',
  'Tereza': '#C5D9F1',
  'Vera': '#FDE9D9',
  'Zaninha': '#F79646',
};
function avatarColor(name) { return PEOPLE_COLORS[name] || AVATAR_COLORS[Object.keys(PEOPLE_COLORS).indexOf(name) % AVATAR_COLORS.length]; }

function typeLabel(t) { return (TYPE_INFO[(t || '').toUpperCase()] || {}).label || t; }
function typeAbbrev(t) { return (TYPE_INFO[(t || '').toUpperCase()] || {}).abbrev || t.toUpperCase(); }
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

  // Stack de histórico de telas
  const screenStackRef = useRef(['login']);
  const isBackNavigationRef = useRef(false);


  useEffect(() => {
    api('/api/people')
      .then(({ data }) => setPeople(data.people || []))
      .catch(err => setPeopleError(err.message))
      .finally(() => setLoadingPeople(false));
  }, []);

  // Intercepta o back button do Android/navegador
  useEffect(() => {
    const handlePopState = () => {
      isBackNavigationRef.current = true;
      const stack = screenStackRef.current;

      // Remove a tela atual do stack
      if (stack.length > 1) {
        stack.pop();
        const prevScreen = stack[stack.length - 1];
        setScreen(prevScreen);
      }
    };

    window.addEventListener('popstate', handlePopState);
    // Push estado inicial
    window.history.pushState({ screen: 'login' }, '', window.location.href);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function goTo(next) {
    // Ignora se foi navegação de volta
    if (isBackNavigationRef.current) {
      isBackNavigationRef.current = false;
      return;
    }

    // Se a tela já está no topo do stack, não faz nada
    const stack = screenStackRef.current;
    if (stack[stack.length - 1] === next) {
      setScreen(next);
      return;
    }

    // Adiciona ao stack e navega
    stack.push(next);
    window.history.pushState({ screen: next }, '', window.location.href);
    setScreen(next);
  }

  function login(name) {
    // Reseta stack no login
    screenStackRef.current = ['login'];
    setCurrentUser(name);
    goTo('home');
  }

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
              {people.map((name) => (
                <button key={name} className="name-chip" onClick={() => login(name)}>
                  <span className="avatar-dot" style={{ background: avatarColor(name) }}>{name[0]}</span>{name}
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
        <HomeScreen currentUser={currentUser} goTo={goTo} onSignOut={() => {
          // Reseta stack no logout
          screenStackRef.current = ['login'];
          setCurrentUser(null);
          goTo('login');
        }} onPickExisting={(m) => { setSelected(m); goTo('rate'); }} />
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
  // Link do grupo Clube do Cinema no WhatsApp
  const waGroupLink = 'https://chat.whatsapp.com/EifUcKM9bwUDELnzn93m4f';
  return { mensagem, waLink: waGroupLink };
}

function Filmstrip() { return <div className="filmstrip" />; }

// -------------------...

// HOME
// -------------------...
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
        <button className="cta-primary" onClick={() => goTo('sheet')}>📋 Ver filmes e séries / avaliar</button>
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
                  <span className="entry-badge">{typeAbbrev(r.tipo)}</span>{r.ano} · {r.pessoa}
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
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                  <button className="sheet-avaliar-btn" onClick={() => {
                    const myScore = r.scores?.[currentUser];
                    onPickExisting({
                      rowNumber: r.rowNumber,
                      nome: r.titulo,
                      tipo: r.tipo,
                      ano: r.ano,
                      imdbLink: r.imdbLink,
                      alreadyRatedByMe: myScore != null,
                      myScore: myScore != null ? formatNota(myScore) : null,
                    });
                  }} disabled={!r.rowNumber}>
                    AVALIAR
                  </button>
                  <div style={{ flex: 1 }} />
                  <a href={`https://www.justwatch.com/br/busca?q=${encodeURIComponent(r.nome || r.titulo)}`}
                     target="_blank"
                     rel="noopener"
                     style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '3px 8px', borderRadius: 16, backgroundColor: '#4A90E2', color: '#fff', fontSize: 10, fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'opacity 0.2s' }}
                     onMouseEnter={(e) => e.target.style.opacity = 0.8}
                     onMouseLeave={(e) => e.target.style.opacity = 1}>
                    JUSTWATCH
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------...
// SEARCH ("O que você viu?")
// -------------------...
function SearchScreen({ currentUser, goTo, onPickExisting, onNotFound, setPrefillData }) {
  const [nome, setNome] = useState('');
  const [ano, setAno] = useState('');
  const [tipoModo, setTipoModo] = useState(''); // 'filme' ou 'serie'
  const [imdbMatches, setImdbMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  async function verificarNoImdb() {
    if (!nome.trim() || !ano.trim() || !tipoModo) {
      setError('Preencha nome, ano e selecione Filme ou Série');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const { data } = await api('/api/imdb-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, ano: parseInt(ano, 10), tipoModo }),
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
      onPickExisting({ rowNumber: filme.rowNumber, nome: filme.nome, tipo: filme.tipo, ano: filme.ano, imdbLink: filme.imdbId ? `https://www.imdb.com/title/${filme.imdbId}/` : null });
    } else {
      // Se não existe, vai cadastrar com dados do IMDb preenchidos (já validados na Tela 1)
      setPrefillData({ nome: filme.nome, ano: parseInt(filme.ano, 10), tipo: filme.tipo, imdbId: filme.imdbId, imdbRating: filme.imdbRating });
      goTo('new');
    }
  }

  return (
    <div className="screen">
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 8, paddingBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button className="back-btn" onClick={() => goTo('home')} style={{ margin: 0, padding: 4, position: 'absolute', left: 12 }}>←</button>
        <h1 style={{ margin: 0 }}>O que você viu?</h1>
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
            <button className={`toggle-btn${tipoModo === 'filme' ? ' active' : ''}`} onClick={() => setTipoModo('filme')}>Filme</button>
            <button className={`toggle-btn${tipoModo === 'serie' ? ' active' : ''}`} onClick={() => setTipoModo('serie')}>Série</button>
          </div>
        </div>

        {error && <div className="status-banner status-error" style={{ display: 'block' }}>{error}</div>}

        <button className="cta-primary" onClick={verificarNoImdb} disabled={searching || !nome.trim() || !ano.trim()}>
          {searching ? 'Verificando...' : 'Verificar no IMDb'}
        </button>

        {searched && imdbMatches.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 12 }}>
              ✅ {imdbMatches.some(m => m.existsInClub) ? 'Encontramos no Clube' : 'Encontramos no IMDb'}:
            </p>
            {imdbMatches.map((m, i) => (
              <div key={i} className="choice-card" style={{ padding: 12, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {m.imdbId ? (
                    <a href={`https://www.imdb.com/title/${m.imdbId}/`} target="_blank" rel="noopener" style={{ color: '#5B9FD9', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                      {m.nome} <span style={{ fontSize: 11 }}>↗</span>
                    </a>
                  ) : <span style={{ fontSize: 14, fontWeight: 500 }}>{m.nome}</span>}
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {typeAbbrev(m.tipo)} · {m.ano} {m.existsInClub && '· Já no clube'} {m.imdbRating && `· IMDb ${m.imdbRating}`}
                  </div>
                </div>
                <button className="link-btn" onClick={() => irParaCadastro(m)} style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', color: '#FFD700' }}>
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
                ❌ Não encontramos no IMDb
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {tipoModo === 'filme' ? 'Filme' : 'Série'} · {ano}
              </div>
            </div>
            <button className="link-btn" onClick={() => {
              // Não encontrou nada, cadastra sem imdbId
              // Usa tipo genérico (F para filme, S para série) já que não foi detectado
              const tipoProvisorio = tipoModo === 'filme' ? 'F' : 'S';
              setPrefillData({ nome: nome.trim(), ano: parseInt(ano, 10), tipo: tipoProvisorio, imdbId: null, imdbRating: null });
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

// -------------------...
// RATE (título já existente)
// -------------------...
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
          <div className="summary-title" style={{ fontSize: 18, fontWeight: 600 }}>{match.nome}</div>
          <div className="summary-meta" style={{ fontSize: 16, marginTop: 8 }}><span className="entry-badge" style={{ fontSize: 14, fontWeight: 600 }}>{typeAbbrev(match.tipo)}</span><span style={{ marginLeft: 8, fontWeight: 500 }}>{match.ano}</span></div>
        </div>

        {match.alreadyRatedByMe && (
          <div className="dupe-error show">
            ⚠️ Você já avaliou este título — nota atual: <strong>{match.myScore}</strong>. Salvar de novo substitui sua nota.
          </div>
        )}

        <div className="field">
          <label>SUA NOTA</label>
          <div className="score-display"><div className="score-num">{formatNota(nota)}</div></div>
          <input type="range" min="0" max="10" step="0.5" value={nota} onChange={e => setNota(parseFloat(e.target.value))} />
        </div>

        {error && <div className="status-banner status-error" style={{ display: 'block' }}>{error}</div>}
        <button className="cta-primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar nota'}</button>
      </div>
    </div>
  );
}

// -------------------...
// NEW (cadastro de título novo)
// -------------------...
function NewScreen({ currentUser, prefill, prefillData, goTo, onDone }) {
  const [nome, setNome] = useState(prefillData?.nome || prefill || '');
  const [tipoModo, setTipoModo] = useState(prefillData?.tipo ? (prefillData.tipo.match(/^(F|FD)$/) ? 'filme' : 'serie') : ''); // 'filme' ou 'serie'
  const [tipo, setTipo] = useState(prefillData?.tipo || ''); // F, FD, S, MS, SD, MSD (auto-detectado)
  const [ano, setAno] = useState(prefillData?.ano ? String(prefillData.ano) : '');
  const [ondeVer, setOndeVer] = useState('');
  const [nota, setNota] = useState(3.5);
  const [stage, setStage] = useState('form'); // form | validating | resultado | duplicate | confirmando
  const [detectingType, setDetectingType] = useState(false);
  const [validatingMsg] = useState('Conferindo no IMDb...');
  const [errorInfo, setErrorInfo] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [dupInfo, setDupInfo] = useState(null);

  useEffect(() => {
    if (prefillData) {
      setNome(prefillData.nome || '');
      setTipo(prefillData.tipo || '');
      setTipoModo(prefillData.tipo ? (prefillData.tipo.match(/^(F|FD)$/) ? 'filme' : 'serie') : '');
      setAno(prefillData.ano ? String(prefillData.ano) : '');
    }
  }, [prefillData]);

  // Auto-detecta tipo quando usuário preenche: Filme/Série + título + ano
  // MAS NÃO roda se vem prefillData (dados já pré-preenchidos do SearchScreen)
  useEffect(() => {
    if (prefillData) {
      // Se vem prefillData, não faz auto-detecção
      return;
    }

    if (!tipoModo || !nome || !ano || ano.length !== 4) {
      setTipo('');
      return;
    }

    const detectarTipo = async () => {
      setDetectingType(true);
      try {
        const res = await fetch('/api/detectType', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, tipoModo, ano: parseInt(ano, 10) }),
        });
        const data = await res.json();

        if (data.found) {
          setTipo(data.tipo);
          setErrorInfo(null);
        } else {
          setErrorInfo(`Não foi possível detectar o tipo automaticamente. Tente com um título mais exato.`);
          setTipo('');
        }
      } catch (err) {
        setErrorInfo(err.message);
        setTipo('');
      } finally {
        setDetectingType(false);
      }
    };

    // Aguarda um curto delay antes de chamar a API para evitar múltiplas chamadas
    const timer = setTimeout(detectarTipo, 500);
    return () => clearTimeout(timer);
  }, [tipoModo, nome, ano, prefillData]);

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
                <div className="summary-meta"><span className="entry-badge">{typeAbbrev(f.tipo)}</span>{f.ano}</div>
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
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 8, paddingBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button className="back-btn" onClick={() => goTo('search')} style={{ margin: 0, padding: 4, position: 'absolute', left: 12 }}>←</button>
        <h1 style={{ margin: 0 }}>Preencha os dados</h1>
      </div>
      <div className="content">
        {prefillData ? (
          // Modo: dados pré-preenchidos (apenas leitura)
          <>
            <div style={{ backgroundColor: 'var(--darker)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Título</p>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#fff' }}>{nome}</h2>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--dark)' }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Tipo</p>
                  <span className="entry-badge" style={{ fontSize: 14, fontWeight: 'bold', padding: '6px 12px' }}>{typeAbbrev(tipo)}</span>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Ano</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--gold)' }}>{ano}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Modo: entrada de dados (editável)
          <>
            <div className="field">
              <label>TÍTULO</label>
              <input type="text" placeholder="Nome exato do filme ou série" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="field">
              <label>TIPO</label>
              <div className="toggle-row">
                <button className={`toggle-btn${tipoModo === 'filme' ? ' active' : ''}`} onClick={() => setTipoModo('filme')} disabled={detectingType}>Filme</button>
                <button className={`toggle-btn${tipoModo === 'serie' ? ' active' : ''}`} onClick={() => setTipoModo('serie')} disabled={detectingType}>Série</button>
              </div>
              {detectingType && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, fontStyle: 'italic' }}>Detectando tipo...</p>}
              {tipo && <p style={{ fontSize: 12, color: 'var(--good)', marginTop: 8, fontWeight: 'bold' }}>Detectado: {typeAbbrev(tipo)}</p>}
              {!detectingType && !tipo && tipoModo && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Preencha o título para detectar o tipo</p>}
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
          </>
        )}
        <div className="field">
          <label>ONDE VIU</label>
          <input type="text" placeholder="Ex: Netflix, cinema..." value={ondeVer} onChange={e => setOndeVer(e.target.value)} />
        </div>
        <div className="field">
          <label>SUA NOTA</label>
          <div className="score-display"><div className="score-num">{formatNota(nota)}</div></div>
          <input type="range" min="0" max="10" step="0.5" value={nota} onChange={e => setNota(parseFloat(e.target.value))} />
        </div>

        {errorInfo && <div className="status-banner status-error" style={{ display: 'block' }}>{errorInfo}</div>}
        <button className="cta-primary" onClick={() => { prefillData?.imdbId !== undefined ? confirmAndSave() : validate(); }} disabled={prefillData ? false : (!nome || !ano || !tipo || detectingType)}>
          Cadastrar
        </button>
        {!prefillData && tipoModo && !tipo && !detectingType && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8 }}>Complete o formulário para detectar o tipo</p>}
      </div>
    </div>
  );
}

// -------------------...
// CONFIRM (mensagem pronta pro WhatsApp)
// -------------------...
function ConfirmScreen({ data, goTo }) {
  function handleShareClick(event) {
    event.preventDefault();
    navigator.clipboard.writeText(data.mensagem);

    let appOpened = false;

    // Se app abrir, navegador perde foco
    const focusHandler = () => {
      appOpened = true;
      window.removeEventListener('focus', focusHandler);
    };
    window.addEventListener('focus', focusHandler);

    // Fallback: se app não abrir em 1.5s
    const fallbackTimer = setTimeout(() => {
      window.removeEventListener('focus', focusHandler);
      if (!appOpened) {
        // App não abriu, abre web direto
        window.location.href = 'https://web.whatsapp.com';
      }
      clearTimeout(fallbackTimer);
    }, 1500);

    // Tenta abrir o app
    window.location.href = data.waLink;
  }

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
        <button className="cta-wa" onClick={handleShareClick}>
          📲 Compartilhar no grupo
        </button>
        <button className="link-btn" onClick={() => goTo('home')}>Pular, voltar ao início</button>
      </div>
    </div>
  );
}

// -------------------...
// SHEET (Ver planilha completa)
// -------------------...
function SheetScreen({ currentUser, goTo, onPickExisting }) {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [sort, setSort] = useState('nome');
  const [filtroEspecial, setFiltroEspecial] = useState('todos'); // 'todos', 'discutidos', 'fila'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    setItems([]);
    const t = setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        tipo: tipo, // respeita a seleção de tipo
        sort: sort, // respeita a seleção de ordenação
        view: filtroEspecial, // passa o tipo de filtro especial
        currentUser: currentUser || ''
      });
      api(`/api/sheet?${params.toString()}`)
        .then(({ data }) => setItems(data.items || []))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, tipo, sort, filtroEspecial, currentUser]);

  function pickFilter(f) { setTipo(f); setSort('nome'); }
  function resetarFiltros() { setFiltroEspecial('todos'); setTipo('todos'); setSort('nome'); setQuery(''); }
  function mudarFiltroEspecial(filtro) { setFiltroEspecial(filtro); setTipo('todos'); setSort('nome'); }

  return (
    <div className="screen">
      <div className="topbar" style={{ borderBottom: 'none', paddingTop: 12, paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button className="back-btn" onClick={() => goTo('home')} style={{ margin: 0, padding: 4, position: 'absolute', left: 12 }}>←</button>
        <h1 style={{ margin: 0 }}>Ver filmes/avaliar</h1>
      </div>
      <div className="content">
        {/* Container com borda para os filtros */}
        <div style={{ border: '2px solid #C9A24B', borderRadius: 8, padding: 12, marginBottom: 16, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)' }}>
          {/* Filtro especial: Todos vs Discutidos vs Fila vs Com nota */}
          <div className="filter-row" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`filter-chip${filtroEspecial === 'todos' ? ' active' : ''}`} onClick={() => mudarFiltroEspecial('todos')}>Todos</button>
              <button className={`filter-chip${filtroEspecial === 'discutidos' ? ' active' : ''}`} onClick={() => mudarFiltroEspecial('discutidos')}>Discutidos</button>
              <button className={`filter-chip${filtroEspecial === 'fila' ? ' active' : ''}`} onClick={() => mudarFiltroEspecial('fila')}>Sem nota - {currentUser}</button>
              <button className={`filter-chip${filtroEspecial === 'comNota' ? ' active' : ''}`} onClick={() => mudarFiltroEspecial('comNota')}>Com nota - {currentUser}</button>
            </div>
          </div>

          <input type="text" placeholder="Buscar título..." value={query} onChange={e => setQuery(e.target.value)} />

          {/* Filtro de tipo - responsivo com flex-wrap */}
          <div className="filter-row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className={`filter-chip${tipo === 'todos' ? ' active' : ''}`} onClick={() => pickFilter('todos')}>Todos</button>
            <button className={`filter-chip${tipo === 'filmes' ? ' active' : ''}`} onClick={() => pickFilter('filmes')}>Filmes</button>
            <button className={`filter-chip${tipo === 'series' ? ' active' : ''}`} onClick={() => pickFilter('series')}>Séries</button>
            <button className={`filter-chip${tipo === 'miniseries' ? ' active' : ''}`} onClick={() => pickFilter('miniseries')}>Miniséries</button>
            <button className={`filter-chip${tipo === 'documentarios' ? ' active' : ''}`} onClick={() => pickFilter('documentarios')}>Documentários</button>
            <button className={`filter-chip${tipo === 'oscar' ? ' active' : ''}`} onClick={() => pickFilter('oscar')}>Oscar</button>
          </div>

          {/* Ordenar - sempre visível */}
          <div className="filter-row" style={{ marginTop: 8 }}>
            <span style={{ color: 'var(--muted)', fontSize: 11, alignSelf: 'center' }}>ORDENAR:</span>
            <button className={`filter-chip${sort === 'imdb' ? ' active' : ''}`} onClick={() => setSort('imdb')}>Nota IMDb</button>
            <button className={`filter-chip${sort === 'media' ? ' active' : ''}`} onClick={() => setSort('media')}>Média Pond.</button>
          </div>
        </div>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}

        {items.map((m, i) => {
          const hasMultipleVotes = m.votos > 1;

          // Número grande conforme a ordenação
          let bigNumber;
          let metaExtra = '';

          if (sort === 'media') {
            // Ordenado por Média Ponderada: número é Média, meta é IMDb (se votos > 1)
            bigNumber = m.mediaPond != null ? formatNota(m.mediaPond) : '—';
            metaExtra = hasMultipleVotes && m.imdbNota ? ` · IMDb ${formatNota(m.imdbNota)}` : '';
          } else if (sort === 'imdb') {
            // Ordenado por IMDb: número é IMDb, meta é Média
            bigNumber = m.imdbNota ? formatNota(m.imdbNota) : '—';
            metaExtra = m.mediaPond != null ? ` · média pond. ${formatNota(m.mediaPond)}` : '';
          } else {
            // Padrão (nome ou outro): número é IMDb, meta é Média Pond.
            bigNumber = m.imdbNota ? formatNota(m.imdbNota) : '—';
            metaExtra = m.mediaPond != null ? ` · média pond. ${formatNota(m.mediaPond)}` : '';
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
                    {typeAbbrev(m.tipo)} · {m.ano} · {m.votos} aval.{m.discutido ? ' · D' : ''}{metaExtra}
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
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                    <button className="sheet-avaliar-btn" onClick={() => onPickExisting(m)}>
                      AVALIAR
                    </button>
                    <div style={{ flex: 1 }} />
                    <a href={`https://www.justwatch.com/br/busca?q=${encodeURIComponent(m.nome)}`}
                       target="_blank"
                       rel="noopener"
                       style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '3px 8px', borderRadius: 16, backgroundColor: '#4A90E2', color: '#fff', fontSize: 10, fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'opacity 0.2s' }}
                       onMouseEnter={(e) => e.target.style.opacity = 0.8}
                       onMouseLeave={(e) => e.target.style.opacity = 1}>
                      JUSTWATCH
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
