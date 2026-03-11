const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, username, phone, role, created_at FROM employees ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { name, username, password, phone, role = 'employee' } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Name, username, and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM employees WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO employees (name, username, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, username, password_hash, phone, role]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, name, username, phone, role }, message: 'Employee created' });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, password } = req.body;

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE employees SET name=?, phone=?, role=?, password_hash=? WHERE id=?', [name, phone, role, password_hash, id]);
    } else {
      await pool.query('UPDATE employees SET name=?, phone=?, role=? WHERE id=?', [name, phone, role, id]);
    }

    res.json({ success: true, message: 'Employee updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
