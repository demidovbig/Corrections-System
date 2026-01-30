require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Corrections System API is running!' });
});

// Get all corrections with filters
app.get('/api/corrections', async (req, res) => {
  try {
    const { status, scopeId, search } = req.query;
    
    let query = `
      SELECT c.*, s.name as scope_name
      FROM corrections c
      LEFT JOIN scopes s ON c.scope_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status IN (?)';
      params.push(status.split(',').map(Number));
    }

    if (scopeId) {
      query += ' AND c.scope_id = ?';
      params.push(Number(scopeId));
    }

    if (search) {
      query += ' AND c.subject_value LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY c.created_at DESC';

    const [corrections] = await pool.execute(query, params);

    // Fetch hypotheses and context for each correction
    for (const correction of corrections) {
      const [hypotheses] = await pool.execute(
        'SELECT * FROM hypotheses WHERE correction_id = ? ORDER BY score DESC',
        [correction.id]
      );
      correction.hypotheses = hypotheses;

      const [context] = await pool.execute(
        'SELECT * FROM context_elements WHERE correction_id = ?',
        [correction.id]
      );
      correction.context = context;
    }

    res.json({ corrections });
  } catch (error) {
    console.error('Error fetching corrections:', error);
    res.status(500).json({ message: 'Ошибка при получении корректировок' });
  }
});

// Get single correction
app.get('/api/corrections/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [corrections] = await pool.execute(
      'SELECT c.*, s.name as scope_name FROM corrections c LEFT JOIN scopes s ON c.scope_id = s.id WHERE c.id = ?',
      [id]
    );

    if (corrections.length === 0) {
      return res.status(404).json({ message: 'Корректировка не найдена' });
    }

    const correction = corrections[0];

    const [hypotheses] = await pool.execute(
      'SELECT * FROM hypotheses WHERE correction_id = ? ORDER BY score DESC',
      [id]
    );
    correction.hypotheses = hypotheses;

    const [context] = await pool.execute(
      'SELECT * FROM context_elements WHERE correction_id = ?',
      [id]
    );
    correction.context = context;

    res.json({ correction });
  } catch (error) {
    console.error('Error fetching correction:', error);
    res.status(500).json({ message: 'Ошибка при получении корректировки' });
  }
});

// Create correction
app.post('/api/corrections', async (req, res) => {
  try {
    const { subjectValue, status = 0, scopeId = 0, hypotheses = [], context = [] } = req.body;

    // Create correction
    const [result] = await pool.execute(
      'INSERT INTO corrections (subject_value, status, scope_id) VALUES (?, ?, ?)',
      [subjectValue, status, scopeId]
    );

    const correctionId = result.insertId;

    // Create hypotheses
    for (const hypothesis of hypotheses) {
      await pool.execute(
        'INSERT INTO hypotheses (correction_id, value, score, approved, suggested_by_reviewer) VALUES (?, ?, ?, ?, ?)',
        [
          correctionId,
          hypothesis.value,
          hypothesis.score || 0,
          hypothesis.approved || false,
          hypothesis.suggested_by_reviewer || false
        ]
      );
    }

    // Create context
    for (const ctx of context) {
      await pool.execute(
        'INSERT INTO context_elements (correction_id, element_key, element_value, important) VALUES (?, ?, ?, ?)',
        [
          correctionId,
          ctx.key,
          ctx.value,
          ctx.important || false
        ]
      );
    }

    res.status(201).json({ 
      message: 'Корректировка создана',
      id: correctionId
    });
  } catch (error) {
    console.error('Error creating correction:', error);
    res.status(500).json({ message: 'Ошибка при создании корректировки' });
  }
});

// Update correction
app.put('/api/corrections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectValue, status, scopeId, hypotheses, context } = req.body;

    // Update correction
    const updates = [];
    const params = [];

    if (subjectValue !== undefined) {
      updates.push('subject_value = ?');
      params.push(subjectValue);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (scopeId !== undefined) {
      updates.push('scope_id = ?');
      params.push(scopeId);
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.execute(
        `UPDATE corrections SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Update hypotheses if provided
    if (hypotheses) {
      // Delete old hypotheses
      await pool.execute('DELETE FROM hypotheses WHERE correction_id = ?', [id]);
      
      // Insert new ones
      for (const hypothesis of hypotheses) {
        await pool.execute(
          'INSERT INTO hypotheses (correction_id, value, score, approved, suggested_by_reviewer) VALUES (?, ?, ?, ?, ?)',
          [
            id,
            hypothesis.value,
            hypothesis.score || 0,
            hypothesis.approved || false,
            hypothesis.suggested_by_reviewer || false
          ]
        );
      }
    }

    // Update context if provided
    if (context) {
      // Delete old context
      await pool.execute('DELETE FROM context_elements WHERE correction_id = ?', [id]);
      
      // Insert new ones
      for (const ctx of context) {
        await pool.execute(
          'INSERT INTO context_elements (correction_id, element_key, element_value, important) VALUES (?, ?, ?, ?)',
          [
            id,
            ctx.key,
            ctx.value,
            ctx.important || false
          ]
        );
      }
    }

    res.json({ message: 'Корректировка обновлена' });
  } catch (error) {
    console.error('Error updating correction:', error);
    res.status(500).json({ message: 'Ошибка при обновлении корректировки' });
  }
});

// Delete correction
app.delete('/api/corrections/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM corrections WHERE id = ?', [id]);

    res.json({ message: 'Корректировка удалена' });
  } catch (error) {
    console.error('Error deleting correction:', error);
    res.status(500).json({ message: 'Ошибка при удалении корректировки' });
  }
});

// Update correction status
app.patch('/api/corrections/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.execute(
      'UPDATE corrections SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Статус обновлён' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Ошибка при обновлении статуса' });
  }
});

// Get all scopes
app.get('/api/scopes', async (req, res) => {
  try {
    const [scopes] = await pool.execute('SELECT * FROM scopes ORDER BY name');
    res.json({ scopes });
  } catch (error) {
    console.error('Error fetching scopes:', error);
    res.status(500).json({ message: 'Ошибка при получении областей' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`🚀 Corrections System API запущен на http://localhost:${PORT}`);
});