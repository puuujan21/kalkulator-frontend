import { useState, useEffect } from 'react';

type Cel = {
  id: number;
  nazwa: string;
  docelowa: number;
  aktualna: number;
};

const API = '/api';
function getToken() { return localStorage.getItem('token') || ''; }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'hsl(240,6%,10%)',
  border: '1px solid hsl(240,4%,16%)',
  borderRadius: '8px',
  color: 'hsl(0,0%,98%)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'hsl(240,5%,55%)',
  marginBottom: '0.375rem',
  display: 'block',
};

function Cele() {
  const [cele, setCele] = useState<Cel[]>([]);
  const [nazwa, setNazwa] = useState('');
  const [docelowa, setDocelowa] = useState('');
  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [wplacanaKwota, setWplacanaKwota] = useState<{ [id: number]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/cele`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(setCele);
  }, []);

  const dodajCel = async () => {
    if (!nazwa || !docelowa) return;
    const odpowiedz = await fetch(`${API}/cele`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ nazwa, docelowa: parseFloat(docelowa) }),
    });
    const nowy = await odpowiedz.json();
    setCele([...cele, nowy]);
    setNazwa('');
    setDocelowa('');
    setPokazFormularz(false);
  };

  const dodajSrodki = async (id: number) => {
    const kwota = parseFloat(wplacanaKwota[id] || '0');
    if (!kwota) return;
    const odpowiedz = await fetch(`${API}/cele/${id}/wplata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ kwota }),
    });
    const zaktualizowany = await odpowiedz.json();
    setCele(cele.map(c => c.id === id ? zaktualizowany : c));
    setWplacanaKwota(prev => ({ ...prev, [id]: '' }));
  };

  const usunCel = async (id: number) => {
    await fetch(`${API}/cele/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setCele(cele.filter(c => c.id !== id));
  };

  const focusStyle = (field: string): React.CSSProperties => ({
    borderColor: focusedField === field ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
  });

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Nagłówek */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
            Cele oszczędnościowe
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)', marginTop: '0.25rem' }}>
            {cele.length > 0 ? `${cele.length} aktywnych celów` : 'Zacznij oszczędzać na coś ważnego'}
          </p>
        </div>
        <button
          onClick={() => setPokazFormularz(!pokazFormularz)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: pokazFormularz ? 'hsl(240,6%,10%)' : 'hsl(217,91%,60%)',
            border: pokazFormularz ? '1px solid hsl(240,4%,16%)' : 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {pokazFormularz ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Anuluj
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nowy cel
            </>
          )}
        </button>
      </div>

      {/* Formularz nowego celu */}
      {pokazFormularz && (
        <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nazwa celu</label>
            <input
              value={nazwa} onChange={e => setNazwa(e.target.value)}
              placeholder="np. Nowy laptop"
              style={{ ...inputStyle, ...focusStyle('nazwa') }}
              onFocus={() => setFocusedField('nazwa')} onBlur={() => setFocusedField(null)}
            />
          </div>
          <div>
            <label style={labelStyle}>Kwota docelowa (zł)</label>
            <input
              type="number" value={docelowa} onChange={e => setDocelowa(e.target.value)}
              placeholder="np. 3000"
              style={{ ...inputStyle, ...focusStyle('docelowa') }}
              onFocus={() => setFocusedField('docelowa')} onBlur={() => setFocusedField(null)}
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={dodajCel}
              style={{ padding: '0.5rem 1.25rem', background: 'hsl(217,91%,60%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Dodaj cel
            </button>
          </div>
        </div>
      )}

      {/* Lista celów */}
      {cele.length === 0 ? (
        <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,45%)' }}>Nie masz jeszcze żadnych celów. Dodaj pierwszy!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cele.map(cel => {
            const procent = Math.min(100, Math.round((Number(cel.aktualna) / Number(cel.docelowa)) * 100));
            const osiagniety = procent >= 100;
            return (
              <div
                key={cel.id}
                style={{ background: 'hsl(240,6%,7%)', border: `1px solid ${osiagniety ? 'hsl(142,60%,20%)' : 'hsl(240,4%,13%)'}`, borderRadius: '12px', padding: '1.25rem' }}
              >
                {/* Górny wiersz */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(0,0%,98%)' }}>{cel.nazwa}</span>
                    {osiagniety && (
                      <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', background: 'hsl(142,60%,10%)', color: 'hsl(142,71%,55%)', borderRadius: '999px', fontWeight: 500 }}>
                        Osiągnięty!
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => usunCel(cel.id)}
                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: 'hsl(240,5%,40%)', cursor: 'pointer', fontSize: '14px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsl(0,60%,15%)'; e.currentTarget.style.color = 'hsl(0,72%,60%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(240,5%,40%)'; }}
                  >
                    ✕
                  </button>
                </div>

                {/* Pasek postępu */}
                <div style={{ height: '6px', background: 'hsl(240,4%,13%)', borderRadius: '999px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${procent}%`,
                    background: osiagniety ? 'hsl(142,71%,55%)' : 'hsl(217,91%,60%)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>

                {/* Kwoty */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: osiagniety ? 0 : '0.875rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>
                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(cel.aktualna))} odłożone
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>
                    {procent}% z {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(cel.docelowa))}
                  </span>
                </div>

                {/* Wpłata */}
                {!osiagniety && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      placeholder="Dodaj kwotę..."
                      value={wplacanaKwota[cel.id] || ''}
                      onChange={e => setWplacanaKwota(prev => ({ ...prev, [cel.id]: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={() => dodajSrodki(cel.id)}
                      style={{ padding: '0.625rem 1rem', background: 'hsl(240,6%,12%)', border: '1px solid hsl(240,4%,18%)', borderRadius: '8px', color: 'hsl(0,0%,85%)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'hsl(217,91%,60%)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'hsl(240,6%,12%)'}
                    >
                      Wpłać
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Cele;