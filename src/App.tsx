import React, { useState } from 'react';
import './App.css';
import Kalkulator from './Kalkulator';
import Wydatki from './Wydatki';
import Cele from './Cele';
import Dashboard from './Dashboard';
import CzyStac from './CzyStac';

function App() {
  const [aktywnaZakladka, setAktywnaZakladka] = useState('kalkulator');

  return (
    <div className="app">
      <header className="header">
        <h1>Planer Finansowy</h1>
        <nav className="nav">
          <button onClick={() => setAktywnaZakladka('dashboard')} className={aktywnaZakladka === 'dashboard' ? 'aktywny' : ''}>Dashboard</button>
          <button onClick={() => setAktywnaZakladka('wydatki')} className={aktywnaZakladka === 'wydatki' ? 'aktywny' : ''}>Wydatki</button>
          <button onClick={() => setAktywnaZakladka('kalkulator')} className={aktywnaZakladka === 'kalkulator' ? 'aktywny' : ''}>Kalkulator</button>
          <button onClick={() => setAktywnaZakladka('cele')} className={aktywnaZakladka === 'cele' ? 'aktywny' : ''}>Cele</button>
          <button onClick={() => setAktywnaZakladka('czy-stac')} className={aktywnaZakladka === 'czy-stac' ? 'aktywny' : ''}>Czy Stac</button>
        </nav>
      </header>
      <main>
        {aktywnaZakladka === 'kalkulator' && <Kalkulator />}
        {aktywnaZakladka === 'dashboard' && <Dashboard />}
        {aktywnaZakladka === 'wydatki' && <Wydatki />}
        {aktywnaZakladka === 'cele' && <Cele />}
        {aktywnaZakladka === 'czy-stac' && <CzyStac />}
      </main>
    </div>
  );
}

export default App;