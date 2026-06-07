import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

function Profil() {
  const [dochodNetto, setDochodNetto] = useState('');
  const [staleWydatki, setStaleWydatki] = useState('');
  const [zapisano, setZapisano] = useState(false);
  const [ladowanie, setLadowanie] = useState(true);

  useEffect(() => {
    fetch(`${API}/profil`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((dane) => {
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

  const wolneŚrodki = (parseFloat(dochodNetto) || 0) - (parseFloat(staleWydatki) || 0);

  if (ladowanie) return <div className="karta"><p>Ładowanie...</p></div>;

  return (
    <div className="karta">
      <h2>Mój Profil Finansowy</h2>
      <p style={{ color: '#4a5568', marginBottom: '1.5rem' }}>
        Wpisz swoje dane raz — będą używane automatycznie w kalkulatorach.
      </p>

      <div className="formularz">
        <label>Miesięczny dochód netto (zł)</label>
        <input
          type="number"
          value={dochodNetto}
          onChange={(e) => setDochodNetto(e.target.value)}
          placeholder="np. 5000"
        />

        <label>Stałe miesięczne wydatki (zł)</label>
        <input
          type="number"
          value={staleWydatki}
          onChange={(e) => setStaleWydatki(e.target.value)}
          placeholder="np. 2000 (czynsz, internet, subskrypcje)"
        />

        {dochodNetto && (
          <div className="dostepne-srodki">
            <span>Wolne środki miesięcznie:</span>
            <strong className={wolneŚrodki > 0 ? 'zielony' : 'czerwony'}>
              {wolneŚrodki.toFixed(2)} zł
            </strong>
          </div>
        )}

        <button className="przycisk-dodaj" onClick={zapisz}>
          Zapisz profil
        </button>

        {zapisano && (
          <p style={{ color: '#16a34a', textAlign: 'center' }}>✓ Profil zapisany</p>
        )}
      </div>
    </div>
  );
}

export default Profil;