import React, { useState } from 'react';

type Tryb = 'kredyt' | 'gotowka';

const BANKI = [
  { nazwa: 'PKO BP', oprocentowanie: 0.0899 },
  { nazwa: 'Pekao', oprocentowanie: 0.0920 },
  { nazwa: 'ING', oprocentowanie: 0.0879 },
  { nazwa: 'mBank', oprocentowanie: 0.0869 },
  { nazwa: 'Santander', oprocentowanie: 0.0910 },
  { nazwa: 'BNP Paribas', oprocentowanie: 0.0889 },
];

function obliczRate(kwota: number, oprocentowanie: number, miesiaceSplaty: number): number {
  const r = oprocentowanie / 12;
  return (kwota * r * Math.pow(1 + r, miesiaceSplaty)) / (Math.pow(1 + r, miesiaceSplaty) - 1);
}

function CzyStac() {
  const [tryb, setTryb] = useState<Tryb>('kredyt');
  const [kwota, setKwota] = useState('');
  const [bank, setBank] = useState(BANKI[0].nazwa);
  const [okres, setOkres] = useState('360');
  const [dochodNetto, setDochodNetto] = useState('');
  const [stalеWydatki, setStalеWydatki] = useState('');
  const [cenaGotowka, setCenaGotowka] = useState('');

  const wybranyBank = BANKI.find((b) => b.nazwa === bank)!;
  const rata = kwota && okres ? obliczRate(parseFloat(kwota), wybranyBank.oprocentowanie, parseInt(okres)) : 0;
  const dostepneSrodki = parseFloat(dochodNetto || '0') - parseFloat(stalеWydatki || '0');
  const maxRata = dostepneSrodki * 0.35;
  const moznaWziacKredyt = rata > 0 && rata <= maxRata;
  const miesiaceNaGotowke = cenaGotowka && dostepneSrodki > 0
    ? Math.ceil(parseFloat(cenaGotowka) / dostepneSrodki)
    : null;

  return (
    <div className="karta">
      <h2>Czy mnie na to stać?</h2>

      <div className="tryb-przelacznik">
        <button
          className={tryb === 'kredyt' ? 'aktywny' : ''}
          onClick={() => setTryb('kredyt')}
        >
          Na kredyt
        </button>
        <button
          className={tryb === 'gotowka' ? 'aktywny' : ''}
          onClick={() => setTryb('gotowka')}
        >
          Za gotówkę
        </button>
      </div>

      <div className="czy-stac-siatka">
        <div>
          <h3>Twoje finanse</h3>
          <div className="formularz">
            <label>Dochód netto miesięcznie (zł)</label>
            <input
              type="number"
              value={dochodNetto}
              onChange={(e) => setDochodNetto(e.target.value)}
              placeholder="np. 5000"
            />
            <label>Stałe wydatki miesięcznie (zł)</label>
            <input
              type="number"
              value={stalеWydatki}
              onChange={(e) => setStalеWydatki(e.target.value)}
              placeholder="np. 2000"
            />
            {dochodNetto && stalеWydatki && (
              <div className="dostepne-srodki">
                <span>Wolne środki miesięcznie:</span>
                <strong className={dostepneSrodki > 0 ? 'zielony' : 'czerwony'}>
                  {dostepneSrodki.toFixed(2)} zł
                </strong>
              </div>
            )}
          </div>
        </div>

        <div>
          {tryb === 'kredyt' && (
            <>
              <h3>Parametry kredytu</h3>
              <div className="formularz">
                <label>Kwota kredytu (zł)</label>
                <input
                  type="number"
                  value={kwota}
                  onChange={(e) => setKwota(e.target.value)}
                  placeholder="np. 300000"
                />
                <label>Bank</label>
                <select value={bank} onChange={(e) => setBank(e.target.value)}>
                  {BANKI.map((b) => (
                    <option key={b.nazwa} value={b.nazwa}>
                      {b.nazwa} ({(b.oprocentowanie * 100).toFixed(2)}%)
                    </option>
                  ))}
                </select>
                <label>Okres spłaty</label>
                <select value={okres} onChange={(e) => setOkres(e.target.value)}>
                  <option value="60">5 lat</option>
                  <option value="120">10 lat</option>
                  <option value="180">15 lat</option>
                  <option value="240">20 lat</option>
                  <option value="300">25 lat</option>
                  <option value="360">30 lat</option>
                </select>
              </div>

              {rata > 0 && (
                <div className="wyniki">
                  <div className="wynik-główny">
                    <span>Miesięczna rata</span>
                    <strong>{rata.toFixed(2)} zł</strong>
                  </div>
                  <div className="wynik-szczegoly">
                    <p>Łącznie do spłaty: <span>{(rata * parseInt(okres)).toFixed(2)} zł</span></p>
                    <p>Koszt odsetek: <span>{(rata * parseInt(okres) - parseFloat(kwota)).toFixed(2)} zł</span></p>
                  </div>

                  {dochodNetto && stalеWydatki && (
                    <div className={`ocena-kredytu ${moznaWziacKredyt ? 'ocena-tak' : 'ocena-nie'}`}>
                      <strong>{moznaWziacKredyt ? '✓ Stać Cię na ten kredyt' : '✗ Rata przekracza bezpieczny limit'}</strong>
                      <p>Maksymalna bezpieczna rata: {maxRata.toFixed(2)} zł (35% wolnych środków)</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tryb === 'gotowka' && (
            <>
              <h3>Zakup za gotówkę</h3>
              <div className="formularz">
                <label>Cena zakupu (zł)</label>
                <input
                  type="number"
                  value={cenaGotowka}
                  onChange={(e) => setCenaGotowka(e.target.value)}
                  placeholder="np. 50000"
                />
              </div>

              {miesiaceNaGotowke !== null && cenaGotowka && (
                <div className="wyniki">
                  <div className={`ocena-kredytu ${dostepneSrodki > 0 ? 'ocena-tak' : 'ocena-nie'}`}>
                    {dostepneSrodki <= 0 ? (
                      <strong>✗ Brak wolnych środków do oszczędzania</strong>
                    ) : miesiaceNaGotowke <= 1 ? (
                      <strong>✓ Stać Cię na to już teraz!</strong>
                    ) : (
                      <>
                        <strong>Czas oszczędzania: {miesiaceNaGotowke} miesięcy ({(miesiaceNaGotowke / 12).toFixed(1)} lat)</strong>
                        <p>Odkładając {dostepneSrodki.toFixed(2)} zł miesięcznie</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CzyStac;