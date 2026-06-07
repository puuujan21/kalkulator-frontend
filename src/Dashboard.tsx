import React from 'react';

type Wydatek = {
  id: number;
  nazwa: string;
  kwota: number;
  kategoria: string;
  data: string;
};

type Cel = {
  id: number;
  nazwa: string;
  docelowa: number;
  aktualna: number;
};

function Dashboard() {
  const wydatki: Wydatek[] = JSON.parse(localStorage.getItem('wydatki') || '[]');
  const cele: Cel[] = JSON.parse(localStorage.getItem('cele') || '[]');

  const sumaWydatkow = wydatki.reduce((acc, w) => acc + w.kwota, 0);
  const ostatnieWydatki = wydatki.slice(0, 5);

  return (
    <div className="dashboard">
      <div className="dashboard-siatka">
        <div className="karta stat-karta">
          <p className="stat-label">Łączne wydatki</p>
          <p className="stat-wartosc">{sumaWydatkow.toFixed(2)} zł</p>
        </div>
        <div className="karta stat-karta">
          <p className="stat-label">Liczba wydatków</p>
          <p className="stat-wartosc">{wydatki.length}</p>
        </div>
        <div className="karta stat-karta">
          <p className="stat-label">Aktywne cele</p>
          <p className="stat-wartosc">{cele.length}</p>
        </div>
      </div>

      <div className="dashboard-dolny">
        <div className="karta">
          <h2>Ostatnie wydatki</h2>
          {ostatnieWydatki.length === 0 && <p className="brak-celow">Brak wydatków</p>}
          {ostatnieWydatki.map((w) => (
            <div key={w.id} className="wydatek-row">
              <div>
                <strong>{w.nazwa}</strong>
                <span className="kategoria-tag">{w.kategoria}</span>
              </div>
              <div className="wydatek-prawa">
                <span>{w.data}</span>
                <strong>{w.kwota.toFixed(2)} zł</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="karta">
          <h2>Cele oszczędnościowe</h2>
          {cele.length === 0 && <p className="brak-celow">Brak celów</p>}
          {cele.map((cel) => {
            const procent = Math.round((cel.aktualna / cel.docelowa) * 100);
            return (
              <div key={cel.id} className="cel-dashboard">
                <div className="cel-top">
                  <span>{cel.nazwa}</span>
                  <span>{procent}%</span>
                </div>
                <div className="pasek-tlo">
                  <div className="pasek-wypelnienie" style={{ width: `${procent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;