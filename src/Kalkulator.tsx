import { useState } from 'react';

type TypUmowy = 'uop' | 'zlecenie' | 'b2b';
type TypB2B = 'liniowy' | 'ryczalt';
type TypZUSB2B = 'normalny' | 'preferencyjny' | 'ulga_na_start';
type TrybWprowadzania = 'miesiac_brutto' | 'miesiac_netto' | 'godzinowa' | 'roczna_brutto' | 'roczna_netto';

const ZUS_PRAC = { emerytalna: 0.0976, rentowa: 0.015, chorobowa: 0.0245 };
const ZUS_B2B_NORMALNY = 1648;
const ZUS_B2B_PREFERENCYJNY = 403;
const KWOTA_WOLNA = 30000 / 12;
const ULGA_MIESIECZNA = KWOTA_WOLNA * 0.12;
const KOSZTY_UOP = 250;

const STAWKI_RYCZALTU = [
  { label: 'IT / programowanie (12%)', value: 0.12 },
  { label: 'Wolne zawody (17%)', value: 0.17 },
  { label: 'Usługi (8.5%)', value: 0.085 },
  { label: 'Usługi techniczne (5.5%)', value: 0.055 },
  { label: 'Handel (3%)', value: 0.03 },
];

type Skladka = { nazwa: string; kwota: number };
type Wynik = { netto: number; brutto: number; skladki: Skladka[]; uwagi: string[] };

function obliczUoP(brutto: number, ulgaMlodych: boolean): Wynik {
  const em = brutto * ZUS_PRAC.emerytalna;
  const ren = brutto * ZUS_PRAC.rentowa;
  const cho = brutto * ZUS_PRAC.chorobowa;
  const zusSum = em + ren + cho;
  const zdrowotna = (brutto - zusSum) * 0.09;
  let podatek = 0;
  if (!ulgaMlodych) {
    const podstawa = Math.max(brutto - zusSum - KOSZTY_UOP, 0);
    podatek = Math.max(podstawa * 0.12 - ULGA_MIESIECZNA, 0);
  }
  const netto = brutto - zusSum - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      { nazwa: 'Emerytalna (9.76%)', kwota: em },
      { nazwa: 'Rentowa (1.5%)', kwota: ren },
      { nazwa: 'Chorobowa (2.45%)', kwota: cho },
      { nazwa: 'Zdrowotna (9%)', kwota: zdrowotna },
      { nazwa: 'Zaliczka PIT (12%)', kwota: podatek },
    ],
    uwagi: ulgaMlodych ? ['Ulga dla młodych aktywna — brak PIT do limitu 85 528 zł/rok'] : [],
  };
}

function obliczZlecenie(brutto: number, studentDoLat26: boolean): Wynik {
  if (studentDoLat26) {
    return { netto: brutto, brutto, skladki: [], uwagi: ['Student lub osoba do 26 lat — brak ZUS i brak PIT'] };
  }
  const em = brutto * ZUS_PRAC.emerytalna;
  const ren = brutto * ZUS_PRAC.rentowa;
  const cho = brutto * ZUS_PRAC.chorobowa;
  const zusSum = em + ren + cho;
  const zdrowotna = (brutto - zusSum) * 0.09;
  const koszty = brutto * 0.2;
  const podatek = Math.max((brutto - zusSum - koszty) * 0.12 - ULGA_MIESIECZNA, 0);
  const netto = brutto - zusSum - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      { nazwa: 'Emerytalna (9.76%)', kwota: em },
      { nazwa: 'Rentowa (1.5%)', kwota: ren },
      { nazwa: 'Chorobowa (2.45%)', kwota: cho },
      { nazwa: 'Zdrowotna (9%)', kwota: zdrowotna },
      { nazwa: 'Zaliczka PIT (12%)', kwota: podatek },
    ],
    uwagi: [],
  };
}

function obliczB2BLiniowy(brutto: number, typZUS: TypZUSB2B): Wynik {
  const zus = typZUS === 'normalny' ? ZUS_B2B_NORMALNY : typZUS === 'preferencyjny' ? ZUS_B2B_PREFERENCYJNY : 0;
  const dochod = Math.max(brutto - zus, 0);
  const zdrowotna = Math.max(dochod * 0.049, 229);
  const odliczenieZdrowotnej = Math.min(zdrowotna, 850);
  const podstawaPodatku = Math.max(dochod - odliczenieZdrowotnej, 0);
  const podatek = podstawaPodatku * 0.19;
  const netto = brutto - zus - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      ...(zus > 0 ? [{ nazwa: `ZUS (${typZUS})`, kwota: zus }] : []),
      { nazwa: 'Składka zdrowotna (4.9%)', kwota: zdrowotna },
      { nazwa: 'Podatek liniowy (19%)', kwota: podatek },
    ],
    uwagi: [typZUS === 'ulga_na_start' ? 'Ulga na start — brak ZUS przez pierwsze 6 miesięcy' : typZUS === 'preferencyjny' ? 'ZUS preferencyjny — pierwsze 2 lata' : 'ZUS normalny'],
  };
}

function obliczB2BRyczalt(brutto: number, typZUS: TypZUSB2B, stawka: number): Wynik {
  const zus = typZUS === 'normalny' ? ZUS_B2B_NORMALNY : typZUS === 'preferencyjny' ? ZUS_B2B_PREFERENCYJNY : 0;
  const zdrowotna = brutto < 5000 ? 462 : brutto < 25000 ? 769 : 1385;
  const podatek = brutto * stawka;
  const netto = brutto - zus - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      ...(zus > 0 ? [{ nazwa: `ZUS (${typZUS})`, kwota: zus }] : []),
      { nazwa: 'Składka zdrowotna (ryczałtowa)', kwota: zdrowotna },
      { nazwa: `Podatek ryczałtowy (${(stawka * 100).toFixed(1)}%)`, kwota: podatek },
    ],
    uwagi: [typZUS === 'ulga_na_start' ? 'Ulga na start — brak ZUS przez pierwsze 6 miesięcy' : typZUS === 'preferencyjny' ? 'ZUS preferencyjny — pierwsze 2 lata' : 'ZUS normalny'],
  };
}

function znajdzBrutto(doceloweNetto: number, oblicz: (brutto: number) => Wynik): number {
  let min = doceloweNetto;
  let max = doceloweNetto * 3;
  for (let i = 0; i < 100; i++) {
    const mid = (min + max) / 2;
    if (oblicz(mid).netto < doceloweNetto) min = mid; else max = mid;
  }
  return Math.round((min + max) / 2 * 100) / 100;
}

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

const TRYBY = [
  { value: 'miesiac_brutto', label: 'Brutto → netto' },
  { value: 'miesiac_netto', label: 'Netto → brutto' },
  { value: 'godzinowa', label: 'Stawka godzinowa' },
  { value: 'roczna_brutto', label: 'Roczna brutto' },
  { value: 'roczna_netto', label: 'Roczna netto' },
];

const UMOWY = [
  { value: 'uop', label: 'Umowa o pracę' },
  { value: 'zlecenie', label: 'Umowa zlecenie' },
  { value: 'b2b', label: 'B2B' },
];

function Kalkulator() {
  const [trybWprowadzania, setTrybWprowadzania] = useState<TrybWprowadzania>('miesiac_brutto');
  const [wartosc, setWartosc] = useState('');
  const [godziny, setGodziny] = useState('168');
  const [typUmowy, setTypUmowy] = useState<TypUmowy>('uop');
  const [ulgaMlodych, setUlgaMlodych] = useState(false);
  const [studentDoLat26, setStudentDoLat26] = useState(false);
  const [typB2B, setTypB2B] = useState<TypB2B>('liniowy');
  const [typZUSB2B, setTypZUSB2B] = useState<TypZUSB2B>('normalny');
  const [stawkaRyczaltu, setStawkaRyczaltu] = useState(0.12);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [zapisano, setZapisano] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const focusStyle = (field: string): React.CSSProperties => ({
    borderColor: focusedField === field ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
  });

  const obliczDlaTypu = (brutto: number): Wynik => {
    if (typUmowy === 'uop') return obliczUoP(brutto, ulgaMlodych);
    if (typUmowy === 'zlecenie') return obliczZlecenie(brutto, studentDoLat26);
    if (typB2B === 'liniowy') return obliczB2BLiniowy(brutto, typZUSB2B);
    return obliczB2BRyczalt(brutto, typZUSB2B, stawkaRyczaltu);
  };

  const oblicz = (): Wynik | null => {
    const val = parseFloat(wartosc);
    if (!val || val <= 0) return null;
    let brutto = val;
    if (trybWprowadzania === 'miesiac_netto') brutto = znajdzBrutto(val, obliczDlaTypu);
    else if (trybWprowadzania === 'godzinowa') brutto = val * (parseFloat(godziny) || 168);
    else if (trybWprowadzania === 'roczna_brutto') brutto = val / 12;
    else if (trybWprowadzania === 'roczna_netto') brutto = znajdzBrutto(val / 12, obliczDlaTypu);
    return obliczDlaTypu(brutto);
  };

  const wynik = oblicz();

  const zapiszDoProfilu = async () => {
    if (!wynik) return;
    setZapisywanie(true);
    await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify({ dochod_netto: Math.round(wynik.netto) }),
    });
    setZapisywanie(false);
    setZapisano(true);
    setTimeout(() => setZapisano(false), 3000);
  };

  const labelWartosci = () => {
    switch (trybWprowadzania) {
      case 'miesiac_brutto': return 'Miesięczna brutto (zł)';
      case 'miesiac_netto': return 'Miesięczna netto (zł)';
      case 'godzinowa': return 'Stawka godzinowa brutto (zł)';
      case 'roczna_brutto': return 'Roczna brutto (zł)';
      case 'roczna_netto': return 'Roczna netto (zł)';
    }
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ maxWidth: '780px' }}>
      {/* Nagłówek */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
          Kalkulator wynagrodzeń
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)', marginTop: '0.25rem' }}>
          Oblicz wynagrodzenie netto dla różnych typów umów
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        {/* Lewa kolumna — parametry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Tryb wprowadzania */}
          <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(240,5%,55%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Tryb obliczeń
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {TRYBY.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTrybWprowadzania(t.value as TrybWprowadzania)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    background: trybWprowadzania === t.value ? 'hsl(217,91%,60%)' : 'hsl(240,6%,12%)',
                    color: trybWprowadzania === t.value ? '#fff' : 'hsl(240,5%,65%)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kwota */}
          <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>{labelWartosci()}</label>
              <input
                type="number" value={wartosc} onChange={e => setWartosc(e.target.value)}
                placeholder="np. 5000"
                style={{ ...inputStyle, ...focusStyle('wartosc') }}
                onFocus={() => setFocusedField('wartosc')} onBlur={() => setFocusedField(null)}
              />
            </div>
            {trybWprowadzania === 'godzinowa' && (
              <div>
                <label style={labelStyle}>Godziny w miesiącu</label>
                <input
                  type="number" value={godziny} onChange={e => setGodziny(e.target.value)}
                  placeholder="168"
                  style={{ ...inputStyle, ...focusStyle('godziny') }}
                  onFocus={() => setFocusedField('godziny')} onBlur={() => setFocusedField(null)}
                />
              </div>
            )}
          </div>

          {/* Typ umowy */}
          <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(240,5%,55%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Typ umowy
            </p>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem' }}>
              {UMOWY.map(u => (
                <button
                  key={u.value}
                  onClick={() => setTypUmowy(u.value as TypUmowy)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', border: 'none',
                    background: typUmowy === u.value ? 'hsl(217,91%,60%)' : 'hsl(240,6%,12%)',
                    color: typUmowy === u.value ? '#fff' : 'hsl(240,5%,65%)',
                    transition: 'all 0.15s',
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>

            {typUmowy === 'uop' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'hsl(240,5%,65%)', cursor: 'pointer' }}>
                <input type="checkbox" checked={ulgaMlodych} onChange={e => setUlgaMlodych(e.target.checked)} style={{ accentColor: 'hsl(217,91%,60%)' }} />
                Ulga dla młodych (do 26 lat)
              </label>
            )}

            {typUmowy === 'zlecenie' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'hsl(240,5%,65%)', cursor: 'pointer' }}>
                <input type="checkbox" checked={studentDoLat26} onChange={e => setStudentDoLat26(e.target.checked)} style={{ accentColor: 'hsl(217,91%,60%)' }} />
                Student / osoba do 26 lat
              </label>
            )}

            {typUmowy === 'b2b' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Forma opodatkowania</label>
                  <select value={typB2B} onChange={e => setTypB2B(e.target.value as TypB2B)} style={selectStyle}>
                    <option value="liniowy">Podatek liniowy (19%)</option>
                    <option value="ryczalt">Ryczałt ewidencjonowany</option>
                  </select>
                </div>
                {typB2B === 'ryczalt' && (
                  <div>
                    <label style={labelStyle}>Stawka ryczałtu</label>
                    <select value={stawkaRyczaltu} onChange={e => setStawkaRyczaltu(parseFloat(e.target.value))} style={selectStyle}>
                      {STAWKI_RYCZALTU.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Składki ZUS</label>
                  <select value={typZUSB2B} onChange={e => setTypZUSB2B(e.target.value as TypZUSB2B)} style={selectStyle}>
                    <option value="ulga_na_start">Ulga na start (~0 zł)</option>
                    <option value="preferencyjny">Preferencyjny (~403 zł)</option>
                    <option value="normalny">Normalny (~1 648 zł)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prawa kolumna — wyniki */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {wynik ? (
            <>
              {/* Główny wynik */}
              <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(240,5%,55%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Netto miesięcznie
                </p>
                <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'hsl(142,71%,55%)', letterSpacing: '-0.03em', margin: 0 }}>
                  {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(wynik.netto)}
                </p>
                {(trybWprowadzania !== 'miesiac_brutto') && (
                  <p style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)', marginTop: '0.5rem' }}>
                    Brutto: {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(wynik.brutto)}
                  </p>
                )}
              </div>

              {/* Roczne */}
              <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)', marginBottom: '0.25rem' }}>Rocznie netto</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(0,0%,98%)' }}>
                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(wynik.netto * 12)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)', marginBottom: '0.25rem' }}>Rocznie brutto</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(0,0%,98%)' }}>
                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(wynik.brutto * 12)}
                  </p>
                </div>
              </div>

              {/* Składki */}
              <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(240,5%,55%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
                  Odliczenia
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {wynik.skladki.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,60%)' }}>{s.nazwa}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'hsl(0,72%,60%)', fontWeight: 500 }}>
                        -{s.kwota.toFixed(2)} zł
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uwagi */}
              {wynik.uwagi.length > 0 && (
                <div style={{ padding: '0.875rem 1rem', background: 'hsl(217,60%,10%)', border: '1px solid hsl(217,60%,18%)', borderRadius: '8px', display: 'flex', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(217,91%,70%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(217,91%,70%)' }}>{wynik.uwagi[0]}</span>
                </div>
              )}

              {/* Zapisz do profilu */}
              <button
                onClick={zapiszDoProfilu}
                disabled={zapisywanie}
                style={{
                  padding: '0.625rem 1rem', background: 'hsl(240,6%,12%)', border: '1px solid hsl(240,4%,18%)',
                  borderRadius: '8px', color: 'hsl(0,0%,85%)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                  opacity: zapisywanie ? 0.6 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!zapisywanie) e.currentTarget.style.background = 'hsl(217,91%,60%)'; }}
                onMouseLeave={e => e.currentTarget.style.background = 'hsl(240,6%,12%)'}
              >
                {zapisano ? '✓ Zapisano do profilu' : 'Zapisz jako dochód do profilu'}
              </button>
            </>
          ) : (
            <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,35%)' }}>Wpisz kwotę, aby zobaczyć wynik</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Kalkulator;