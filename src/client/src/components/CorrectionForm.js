import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CorrectionForm({ correction, onBack }) {
  const [formData, setFormData] = useState({
    subjectValue: '',
    status: 0,
    scopeId: 0,
    hypotheses: [],
    context: []
  });
  const [scopes, setScopes] = useState([]);
  const [newHypothesis, setNewHypothesis] = useState({ value: '', score: 1, suggested_by_reviewer: true });
  const [newContext, setNewContext] = useState({ key: '', value: '', important: false });

  useEffect(() => {
    fetchScopes();
    
    if (correction) {
      setFormData({
        subjectValue: correction.subject_value || '',
        status: correction.status || 0,
        scopeId: correction.scope_id || 0,
        hypotheses: correction.hypotheses || [],
        context: correction.context || []
      });
    } else {
      // Новая корректировка
      setFormData({
        subjectValue: '',
        status: 0,
        scopeId: 0,
        hypotheses: [],
        context: []
      });
    }
  }, [correction]);

  const fetchScopes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/scopes');
      setScopes(response.data.scopes);
    } catch (error) {
      console.error('Error fetching scopes:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHypothesisChange = (index, field, value) => {
    const newHypotheses = [...formData.hypotheses];
    newHypotheses[index][field] = value;
    setFormData(prev => ({ ...prev, hypotheses: newHypotheses }));
  };

  const handleContextChange = (index, field, value) => {
    const newContext = [...formData.context];
    newContext[index][field] = value;
    setFormData(prev => ({ ...prev, context: newContext }));
  };

  const addHypothesis = () => {
    if (!newHypothesis.value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      hypotheses: [...prev.hypotheses, { ...newHypothesis }]
    }));
    
    setNewHypothesis({ value: '', score: 1, suggested_by_reviewer: true });
  };

  const removeHypothesis = (index) => {
    const newHypotheses = formData.hypotheses.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, hypotheses: newHypotheses }));
  };

  const addContext = () => {
    if (!newContext.key.trim() || !newContext.value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      context: [...prev.context, { ...newContext }]
    }));
    
    setNewContext({ key: '', value: '', important: false });
  };

  const removeContext = (index) => {
    const newContext = formData.context.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, context: newContext }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (correction) {
        // Update existing
        await axios.put(`http://localhost:5001/api/corrections/${correction.id}`, formData);
        alert('Корректировка обновлена!');
      } else {
        // Create new
        await axios.post('http://localhost:5001/api/corrections', formData);
        alert('Корректировка создана!');
      }
      
      onBack();
    } catch (error) {
      console.error('Error saving correction:', error);
      alert('Ошибка при сохранении корректировки');
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '30px'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '30px' }}>
        {correction ? 'Редактирование корректировки' : 'Создание корректировки'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Subject */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Текст (исходное значение):
          </label>
          <input
            type="text"
            name="subjectValue"
            value={formData.subjectValue}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              fontFamily: 'monospace'
            }}
            placeholder="Введите текст для корректировки..."
          />
        </div>

        {/* Status */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Статус:
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          >
            <option value="0">Ожидает проверки</option>
            <option value="1">Подтверждена</option>
            <option value="2">Анулирована</option>
          </select>
        </div>

        {/* Scope */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Предметная область:
          </label>
          <select
            name="scopeId"
            value={formData.scopeId}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          >
            {scopes.map(scope => (
              <option key={scope.id} value={scope.id}>{scope.name}</option>
            ))}
          </select>
        </div>

        {/* Hypotheses */}
        <div style={{ marginBottom: '30px', border: '2px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Гипотезы замены:</h3>
          
          {formData.hypotheses.length > 0 ? (
            formData.hypotheses.map((hyp, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '10px',
                  background: '#f5f5f5',
                  borderRadius: '5px',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  value={hyp.value}
                  onChange={(e) => handleHypothesisChange(index, 'value', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                />
                <input
                  type="number"
                  value={hyp.score}
                  onChange={(e) => handleHypothesisChange(index, 'score', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  style={{ width: '80px', padding: '8px', border: '2px solid #ddd', borderRadius: '4px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    checked={hyp.approved}
                    onChange={(e) => handleHypothesisChange(index, 'approved', e.target.checked)}
                  />
                  Одобрено
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    checked={hyp.suggested_by_reviewer}
                    onChange={(e) => handleHypothesisChange(index, 'suggested_by_reviewer', e.target.checked)}
                  />
                  Ручная
                </label>
                <button
                  type="button"
                  onClick={() => removeHypothesis(index)}
                  style={{
                    padding: '6px 12px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: '#999', fontStyle: 'italic' }}>Нет гипотез</p>
          )}

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={newHypothesis.value}
              onChange={(e) => setNewHypothesis({ ...newHypothesis, value: e.target.value })}
              placeholder="Новая гипотеза..."
              style={{
                flex: 1,
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontFamily: 'monospace'
              }}
            />
            <button
              type="button"
              onClick={addHypothesis}
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ➕ Добавить гипотезу
            </button>
          </div>
        </div>

        {/* Context */}
        <div style={{ marginBottom: '30px', border: '2px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Контекст:</h3>
          
          {formData.context.length > 0 ? (
            formData.context.map((ctx, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '10px',
                  background: '#f5f5f5',
                  borderRadius: '5px',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  value={ctx.element_key}
                  onChange={(e) => handleContextChange(index, 'element_key', e.target.value)}
                  placeholder="Ключ"
                  style={{ flex: 1, padding: '8px', border: '2px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  value={ctx.element_value}
                  onChange={(e) => handleContextChange(index, 'element_value', e.target.value)}
                  placeholder="Значение"
                  style={{ flex: 2, padding: '8px', border: '2px solid #ddd', borderRadius: '4px', fontFamily: 'monospace' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    checked={ctx.important}
                    onChange={(e) => handleContextChange(index, 'important', e.target.checked)}
                  />
                  Важный
                </label>
                <button
                  type="button"
                  onClick={() => removeContext(index)}
                  style={{
                    padding: '6px 12px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: '#999', fontStyle: 'italic' }}>Нет контекста</p>
          )}

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={newContext.key}
              onChange={(e) => setNewContext({ ...newContext, key: e.target.value })}
              placeholder="Ключ..."
              style={{ flex: 1, padding: '10px', border: '2px solid #ddd', borderRadius: '5px' }}
            />
            <input
              type="text"
              value={newContext.value}
              onChange={(e) => setNewContext({ ...newContext, value: e.target.value })}
              placeholder="Значение..."
              style={{ flex: 2, padding: '10px', border: '2px solid #ddd', borderRadius: '5px', fontFamily: 'monospace' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={newContext.important}
                onChange={(e) => setNewContext({ ...newContext, important: e.target.checked })}
              />
              Важный
            </label>
            <button
              type="button"
              onClick={addContext}
              style={{
                padding: '10px 20px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ➕ Добавить контекст
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '12px 30px',
              background: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 30px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}

export default CorrectionForm;