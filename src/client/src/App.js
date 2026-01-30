import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CorrectionsList from './components/CorrectionsList';
import CorrectionForm from './components/CorrectionForm';

function App() {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [filters, setFilters] = useState({
    status: [0, 1, 2], // Все статусы по умолчанию
    scopeId: null,
    search: ''
  });

  const handleEdit = (correction) => {
    setSelectedCorrection(correction);
    setView('form');
  };

  const handleCreate = () => {
    setSelectedCorrection(null);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setSelectedCorrection(null);
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>📋 Система корректировок</h1>
        <div>
          {view === 'list' ? (
            <button
              onClick={handleCreate}
              style={{
                padding: '10px 25px',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              ➕ Добавить корректировку
            </button>
          ) : (
            <button
              onClick={handleBack}
              style={{
                padding: '10px 25px',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              ← Назад к списку
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {view === 'list' ? (
          <CorrectionsList
            filters={filters}
            onFilterChange={setFilters}
            onEdit={handleEdit}
          />
        ) : (
          <CorrectionForm
            correction={selectedCorrection}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}

export default App;