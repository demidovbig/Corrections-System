import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CorrectionsList({ filters, onFilterChange, onEdit }) {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopes, setScopes] = useState([]);

  useEffect(() => {
    fetchData();
    fetchScopes();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      
      if (filters.scopeId) {
        params.append('scopeId', filters.scopeId);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await axios.get(`http://localhost:5001/api/corrections?${params}`);
      setCorrections(response.data.corrections);
    } catch (error) {
      console.error('Error fetching corrections:', error);
      alert('Ошибка при загрузке корректировок');
    } finally {
      setLoading(false);
    }
  };

  const fetchScopes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/scopes');
      setScopes(response.data.scopes);
    } catch (error) {
      console.error('Error fetching scopes:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 0: return '⏳'; // Ожидает
      case 1: return '✅'; // Подтверждена
      case 2: return '❌'; // Аннулирована
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return '#ffebee'; // Красный фон
      case 1: return '#e8f5e9'; // Зелёный фон
      case 2: return '#f5f5f5'; // Серый фон
      default: return 'white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Ожидает';
      case 1: return 'Подтверждена';
      case 2: return 'Анулирована';
      default: return 'Неизвестно';
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:5001/api/corrections/${id}/status`, {
        status: newStatus
      });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту корректировку?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5001/api/corrections/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting correction:', error);
      alert('Ошибка при удалении корректировки');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Фильтры</h3>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status filter */}
          <div>
            <label style={{ marginRight: '10px', fontWeight: '600' }}>Статус:</label>
            <label style={{ marginRight: '10px' }}>
              <input
                type="checkbox"
                checked={filters.status.includes(0)}
                onChange={(e) => {
                  const newStatus = e.target.checked
                    ? [...filters.status, 0]
                    : filters.status.filter(s => s !== 0);
                  onFilterChange({ ...filters, status: newStatus });
                }}
              />
              Ожидает
            </label>
            <label style={{ marginRight: '10px' }}>
              <input
                type="checkbox"
                checked={filters.status.includes(1)}
                onChange={(e) => {
                  const newStatus = e.target.checked
                    ? [...filters.status, 1]
                    : filters.status.filter(s => s !== 1);
                  onFilterChange({ ...filters, status: newStatus });
                }}
              />
              Подтверждена
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.status.includes(2)}
                onChange={(e) => {
                  const newStatus = e.target.checked
                    ? [...filters.status, 2]
                    : filters.status.filter(s => s !== 2);
                  onFilterChange({ ...filters, status: newStatus });
                }}
              />
              Аннулирована
            </label>
          </div>

          {/* Scope filter */}
          <div>
            <label style={{ marginRight: '10px', fontWeight: '600' }}>Область:</label>
            <select
              value={filters.scopeId || ''}
              onChange={(e) => onFilterChange({ ...filters, scopeId: e.target.value || null })}
              style={{
                padding: '8px 12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="">Все области</option>
              {scopes.map(scope => (
                <option key={scope.id} value={scope.id}>{scope.name}</option>
              ))}
            </select>
          </div>

          {/* Search filter */}
          <div style={{ marginLeft: 'auto' }}>
            <input
              type="text"
              placeholder="Поиск по тексту..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                width: '250px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Corrections Table */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#667eea', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left', width: '250px' }}>Текст</th>
              <th style={{ padding: '12px', textAlign: 'left', width: '50px' }}></th>
              <th style={{ padding: '12px', textAlign: 'left', width: '250px' }}>Замена</th>
              <th style={{ padding: '12px', textAlign: 'left', width: '120px' }}>Статус</th>
              <th style={{ padding: '12px', textAlign: 'left', width: '150px' }}>Действия</th>
              <th style={{ padding: '12px', textAlign: 'left', width: '150px' }}>Создана</th>
              <th style={{ padding: '12px', textAlign: 'left', width: '150px' }}>Изменена</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#667eea' }}>
                  Загрузка...
                </td>
              </tr>
            ) : corrections.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                  Нет корректировок
                </td>
              </tr>
            ) : (
              corrections.map(correction => (
                <tr
                  key={correction.id}
                  style={{
                    background: getStatusColor(correction.status),
                    transition: 'background 0.2s'
                  }}
                >
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontFamily: 'monospace' }}>
                    {correction.subject_value}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                    →
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontFamily: 'monospace' }}>
                    {correction.hypotheses.find(h => h.approved)?.value || 
                     correction.hypotheses[0]?.value || 
                     '—'}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getStatusColor(correction.status),
                      color: correction.status === 0 ? '#d32f2f' : 
                             correction.status === 1 ? '#2e7d32' : '#757575'
                    }}>
                      {getStatusIcon(correction.status)} {getStatusText(correction.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleStatusChange(correction.id, 
                          correction.status === 0 ? 1 : 0)}
                        style={{
                          padding: '6px 10px',
                          background: correction.status === 0 ? '#4CAF50' : '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {correction.status === 0 ? '✅' : '🔄'}
                      </button>
                      <button
                        onClick={() => onEdit(correction)}
                        style={{
                          padding: '6px 10px',
                          background: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={() => handleStatusChange(correction.id, 2)}
                        style={{
                          padding: '6px 10px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ❌
                      </button>
                      <button
                        onClick={() => handleDelete(correction.id)}
                        style={{
                          padding: '6px 10px',
                          background: '#9e9e9e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '12px', color: '#666' }}>
                    {new Date(correction.created_at).toLocaleDateString()}
                    <br />
                    {new Date(correction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '12px', color: '#666' }}>
                    {new Date(correction.updated_at).toLocaleDateString()}
                    <br />
                    {new Date(correction.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CorrectionsList;