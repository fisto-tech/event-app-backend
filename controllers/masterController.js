const pool = require('../config/db');

// Expo Names
const getExpos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expo_master WHERE status = "active" ORDER BY expo_name');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createExpo = async (req, res) => {
  try {
    const { expo_name, status = 'active' } = req.body;
    if (!expo_name) return res.status(400).json({ success: false, message: 'Expo name is required' });
    const [result] = await pool.query('INSERT INTO expo_master (expo_name, status) VALUES (?, ?)', [expo_name, status]);
    res.status(201).json({ success: true, data: { id: result.insertId, expo_name, status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateExpo = async (req, res) => {
  try {
    const { id } = req.params;
    const { expo_name, status } = req.body;
    await pool.query('UPDATE expo_master SET expo_name = ?, status = ? WHERE id = ?', [expo_name, status, id]);
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteExpo = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM expo_master WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Enquiry Types
const getEnquiryTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM enquiry_types ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createEnquiryType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const [result] = await pool.query('INSERT INTO enquiry_types (name) VALUES (?)', [name]);
    res.status(201).json({ success: true, data: { id: result.insertId, name } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteEnquiryType = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM enquiry_types WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Industry Types
const getIndustryTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM industry_types ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createIndustryType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const [result] = await pool.query('INSERT INTO industry_types (name) VALUES (?)', [name]);
    res.status(201).json({ success: true, data: { id: result.insertId, name } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteIndustryType = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM industry_types WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// SMS Templates
const getSmsTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sms_templates ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createSmsTemplate = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    const [result] = await pool.query('INSERT INTO sms_templates (title, content) VALUES (?, ?)', [title, content]);
    res.status(201).json({ success: true, data: { id: result.insertId, title, content } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteSmsTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sms_templates WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// WhatsApp Templates
const getWhatsappTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM whatsapp_templates ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createWhatsappTemplate = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    const [result] = await pool.query('INSERT INTO whatsapp_templates (title, content) VALUES (?, ?)', [title, content]);
    res.status(201).json({ success: true, data: { id: result.insertId, title, content } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteWhatsappTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM whatsapp_templates WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Email Templates
const getEmailTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM email_templates ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createEmailTemplate = async (req, res) => {
  try {
    const { title, subject, content } = req.body;
    if (!title || !subject || !content) return res.status(400).json({ success: false, message: 'All fields are required' });
    const [result] = await pool.query('INSERT INTO email_templates (title, subject, content) VALUES (?, ?, ?)', [title, subject, content]);
    res.status(201).json({ success: true, data: { id: result.insertId, title, subject, content } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM email_templates WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getExpos, createExpo, updateExpo, deleteExpo,
  getEnquiryTypes, createEnquiryType, deleteEnquiryType,
  getIndustryTypes, createIndustryType, deleteIndustryType,
  getSmsTemplates, createSmsTemplate, deleteSmsTemplate,
  getWhatsappTemplates, createWhatsappTemplate, deleteWhatsappTemplate,
  getEmailTemplates, createEmailTemplate, deleteEmailTemplate,
};
