import { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

const label: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'hsl(240,5%,55%)',
  marginBottom: '0.375rem',
  display: 'block',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'hsl(240,6%,10%)',
  border: '1px solid hsl(240,4%,16%)',
  borderRadius: '8px',
  color: 'hsl(0,0%,98%)',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

function Profil() {
  const [dochodNetto, setDochodNetto] = useState('');
  const [staleWydatki, setStaleWydatki] = useState('');
  const [zapisano, setZapisano] = useState(false);
  const [ladowanie, setLadowanie] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/profil`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(dane => {
        setDochodNetto(dane.dochod_netto?.toString() || '');
        setStaleWydatki(dane.stale_wydatki?.toString() || '');
        setLadowanie(false);
      });
  }, []);

  const zapisz = async () => {
    await fetch(`${API}/profil`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        dochod_netto: parseFloat(dochodNetto) || 0,
        stale_wydatki: parseFloat(staleWydatki) || 0,
      }),
    });
    setZapisano(true);
    setTimeout(() => setZapisano(false), 3000);
  };

  const wolne = (parseFloat(dochodNetto) || 0) - (parseFloat(staleWydatki) || 0);

  if (ladowanie) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid hsl(240,4%,13%)', borderTopColor: 'hsl(217,91%,60%)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      {/* Nagłówek */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
          Profil finansowy
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)', marginTop: '0.25rem' }}>
          Dane używane automatycznie w kalkulatorach i dashboardzie
        </p>
      </div>

      {/* Karta formularza */}
      <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Dochód netto */}
        <div>
          <label style={label}>Miesięczny dochód netto</label>
          <input
            type="number"
            value={dochodNetto}
            onChange={e => setDochodNetto(e.target.value)}
            placeholder="np. 5000"
            style={{
              ...input,
              borderColor: focusedField === 'dochod' ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
            }}
            onFocus={() => setFocusedField('dochod')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Stałe wydatki */}
        <div>
          <label style={label}>Stałe miesięczne wydatki</label>
          <input
            type="number"
            value={staleWydatki}
            onChange={e => setStaleWydatki(e.target.value)}
            placeholder="np. 2000 (czynsz, internet, subskrypcje)"
            style={{
              ...input,
              borderColor: focusedField === 'wydatki' ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
            }}
            onFocus={() => setFocusedField('wydatki')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Podgląd wolnych środków */}
        {dochodNetto && (
          <div style={{ padding: '1rem', background: 'hsl(240,6%,10%)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)' }}>Wolne środki miesięcznie</span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: wolne >= 0 ? 'hsl(142,71%,55%)' : 'hsl(0,72%,60%)' }}>
              {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(wolne)}
            </span>
          </div>
        )}

        {/* Przycisk */}
        <button
          onClick={zapisz}
          style={{
            padding: '0.625rem 1rem',
            background: 'hsl(217,91%,60%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Zapisz profil
        </button>

        {/* Potwierdzenie */}
        {zapisano && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'hsl(142,60%,10%)', border: '1px solid hsl(142,60%,20%)', borderRadius: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(142,71%,55%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: '0.875rem', color: 'hsl(142,71%,55%)' }}>Profil zapisany</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profil;