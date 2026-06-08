import { useState, useEffect } from 'react';

type Kategoria = 'jedzenie' | 'transport' | 'mieszkanie' | 'rozrywka' | 'zdrowie' | 'inne';

type Wydatek = {
  id: number;
  nazwa: string;
  kwota: number;
  kategoria: Kategoria;
  data: string;
  staly: boolean;
};

const KATEGORIE: { value: Kategoria; label: string; kolor: string }[] = [
  { value: 'jedzenie', label: 'Jedzenie', kolor: 'hsl(38,92%,60%)' },
  { value: 'transport', label: 'Transport', kolor: 'hsl(217,91%,60%)' },
  { value: 'mieszkanie', label: 'Mieszkanie', kolor: 'hsl(270,70%,65%)' },
  { value: 'rozrywka', label: 'Rozrywka', kolor: 'hsl(330,80%,65%)' },
  { value: 'zdrowie', label: 'Zdrowie', kolor: 'hsl(142,71%,55%)' },
  { value: 'inne', label: 'Inne', kolor: 'hsl(240,5%,55%)' },
];

const NAZWY_MIESIECY = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
];

const API = 'http://localhost:5000/api';
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

function getKolor(kat: string) {
  return KATEGORIE.find(k => k.value === kat)?.kolor ?? 'hsl(240,5%,55%)';
}

function Wydatki() {
  const now = new Date();
  const [wydatki, setWydatki] = useState<Wydatek[]>([]);
  const [nazwa, setNazwa] = useState('');
  const [kwota, setKwota] = useState('');
  const [kategoria, setKategoria] = useState<Kategoria>('inne');
  const [data, setData] = useState(now.toISOString().split('T')[0]);
  const [staly, setStaly] = useState(false);
  const [filtrRok, setFiltrRok] = useState(now.getFullYear());
  const [filtrMiesiac, setFiltrMiesiac] = useState(now.getMonth() + 1);
  const [filtrWszystko, setFiltrWszystko] = useState(false);
  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    let url = `${API}/wydatki`;
    if (!filtrWszystko) url += `?rok=${filtrRok}&miesiac=${filtrMiesiac}`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(setWydatki);
  }, [filtrRok, filtrMiesiac, filtrWszystko]);

  const dodajWydatek = async () => {
    if (!nazwa || !kwota) return;
    const odpowiedz = await fetch(`${API}/wydatki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ nazwa, kwota: parseFloat(kwota), kategoria, data, staly }),
    });
    const nowy = await odpowiedz.json();
    setWydatki([nowy, ...wydatki]);
    setNazwa('');
    setKwota('');
    setStaly(false);
    setPokazFormularz(false);
  };

  const usunWydatek = async (id: number) => {
    await fetch(`${API}/wydatki/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setWydatki(wydatki.filter(w => w.id !== id));
  };

  const suma = wydatki.reduce((acc, w) => acc + Number(w.kwota), 0);
  const sumaPoKategorii = KATEGORIE.map(kat => ({
    ...kat,
    suma: wydatki.filter(w => w.kategoria === kat.value).reduce((acc, w) => acc + Number(w.kwota), 0),
  })).filter(k => k.suma > 0);

  const lata = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as any,
  };

  const focusStyle = (field: string): React.CSSProperties => ({
    borderColor: focusedField === field ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
  });

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Nagłówek */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
            Wydatki
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)', marginTop: '0.25rem' }}>
            {filtrWszystko ? 'Wszystkie wydatki' : `${NAZWY_MIESIECY[filtrMiesiac - 1]} ${filtrRok}`}
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
              Dodaj wydatek
            </>
          )}
        </button>
      </div>

      {/* Formularz */}
      {pokazFormularz && (
        <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nazwa</label>
            <input
              value={nazwa} onChange={e => setNazwa(e.target.value)}
              placeholder="np. Biedronka"
              style={{ ...inputStyle, ...focusStyle('nazwa') }}
              onFocus={() => setFocusedField('nazwa')} onBlur={() => setFocusedField(null)}
            />
          </div>
          <div>
            <label style={labelStyle}>Kwota (zł)</label>
            <input
              type="number" value={kwota} onChange={e => setKwota(e.target.value)}
              placeholder="np. 50"
              style={{ ...inputStyle, ...focusStyle('kwota') }}
              onFocus={() => setFocusedField('kwota')} onBlur={() => setFocusedField(null)}
            />
          </div>
          <div>
            <label style={labelStyle}>Kategoria</label>
            <select
              value={kategoria} onChange={e => setKategoria(e.target.value as Kategoria)}
              style={{ ...selectStyle, ...focusStyle('kat') }}
              onFocus={() => setFocusedField('kat')} onBlur={() => setFocusedField(null)}
            >
              {KATEGORIE.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Data</label>
            <input
              type="date" value={data} onChange={e => setData(e.target.value)}
              style={{ ...inputStyle, ...focusStyle('data'), colorScheme: 'dark' }}
              onFocus={() => setFocusedField('data')} onBlur={() => setFocusedField(null)}
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'hsl(240,5%,65%)' }}>
              <input type="checkbox" checked={staly} onChange={e => setStaly(e.target.checked)}
                style={{ width: '14px', height: '14px', accentColor: 'hsl(217,91%,60%)' }} />
              Stały wydatek (czynsz, abonament)
            </label>
            <button
              onClick={dodajWydatek}
              style={{ padding: '0.5rem 1.25rem', background: 'hsl(217,91%,60%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Dodaj
            </button>
          </div>
        </div>
      )}

      {/* Filtr okresu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <select
          value={filtrRok} onChange={e => setFiltrRok(Number(e.target.value))} disabled={filtrWszystko}
          style={{ ...selectStyle, width: 'auto', padding: '0.4rem 0.75rem', opacity: filtrWszystko ? 0.4 : 1 }}
        >
          {lata.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filtrMiesiac} onChange={e => setFiltrMiesiac(Number(e.target.value))} disabled={filtrWszystko}
          style={{ ...selectStyle, width: 'auto', padding: '0.4rem 0.75rem', opacity: filtrWszystko ? 0.4 : 1 }}
        >
          {NAZWY_MIESIECY.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'hsl(240,5%,55%)', cursor: 'pointer' }}>
          <input type="checkbox" checked={filtrWszystko} onChange={e => setFiltrWszystko(e.target.checked)}
            style={{ accentColor: 'hsl(217,91%,60%)' }} />
          Wszystkie
        </label>
      </div>

      {wydatki.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          {/* Lista wydatków */}
          <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', overflow: 'hidden' }}>
            {wydatki.map((w, i) => (
              <div
                key={w.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.875rem 1.25rem',
                  borderBottom: i < wydatki.length - 1 ? '1px solid hsl(240,4%,11%)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '3px', height: '32px', borderRadius: '999px', background: getKolor(w.kategoria), flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(0,0%,98%)' }}>{w.nazwa}</span>
                      {w.staly && (
                        <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', background: 'hsl(217,60%,15%)', color: 'hsl(217,91%,70%)', borderRadius: '999px', fontWeight: 500 }}>
                          Stały
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(240,5%,45%)' }}>
                      {KATEGORIE.find(k => k.value === w.kategoria)?.label} · {w.data?.toString().split('T')[0]}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(0,72%,60%)' }}>
                    -{Number(w.kwota).toFixed(2)} zł
                  </span>
                  <button
                    onClick={() => usunWydatek(w.id)}
                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: 'hsl(240,5%,40%)', cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsl(0,60%,15%)'; e.currentTarget.style.color = 'hsl(0,72%,60%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(240,5%,40%)'; }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {/* Suma */}
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid hsl(240,4%,13%)', display: 'flex', justifyContent: 'space-between', background: 'hsl(240,6%,6%)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>Łącznie</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(0,0%,98%)' }}>{suma.toFixed(2)} zł</span>
            </div>
          </div>

          {/* Podział na kategorie */}
          <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(240,5%,55%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Według kategorii
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {sumaPoKategorii.map(k => (
                <div key={k.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(0,0%,85%)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: k.kolor, display: 'inline-block' }} />
                      {k.label}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,65%)' }}>{k.suma.toFixed(2)} zł</span>
                  </div>
                  <div style={{ height: '3px', background: 'hsl(240,4%,13%)', borderRadius: '999px' }}>
                    <div style={{ height: '100%', width: `${Math.round((k.suma / suma) * 100)}%`, background: k.kolor, borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,45%)' }}>Brak wydatków w wybranym okresie</p>
        </div>
      )}
    </div>
  );
}

export default Wydatki;