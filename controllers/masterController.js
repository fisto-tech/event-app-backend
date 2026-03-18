const pool = require('../config/db');

// ─── SOURCES (from "Others" dropdown entries) ─────────────────────────────────

const getSources = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sources ORDER BY source_name');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// When user enters a new source name in the "Others" field during registration
const addSource = async (req, res) => {
  try {
    const { source_name } = req.body;
    if (!source_name || !source_name.trim()) {
      return res.status(400).json({ success: false, message: 'Source name is required' });
    }

    const trimmedName = source_name.trim();
    // Check if source already exists
    const [existing] = await pool.query('SELECT id FROM sources WHERE source_name = ?', [trimmedName]);
    
    if (existing.length > 0) {
      return res.json({ success: true, data: { id: existing[0].id, source_name: trimmedName }, message: 'Source already exists' });
    }

    const [result] = await pool.query('INSERT INTO sources (source_name) VALUES (?)', [trimmedName]);
    res.status(201).json({ success: true, data: { id: result.insertId, source_name: trimmedName } });
  } catch (error) {
    console.error('Add source error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── EXPO NAMES ────────────────────────────────────────────────────────────────

const getExpos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expo_master WHERE status = "active" ORDER BY expo_name');
    // Parse conduct_dates JSON for each row
    const data = rows.map(r => ({
      ...r,
      conduct_dates: r.conduct_dates
        ? (typeof r.conduct_dates === 'string' ? JSON.parse(r.conduct_dates) : r.conduct_dates)
        : [],
    }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createExpo = async (req, res) => {
  try {
    const { expo_name, status = 'active', conduct_dates = [], remarks = null } = req.body;
    if (!expo_name) return res.status(400).json({ success: false, message: 'Expo name is required' });
    const [result] = await pool.query(
      'INSERT INTO expo_master (expo_name, status, conduct_dates, remarks) VALUES (?, ?, ?, ?)',
      [expo_name, status, JSON.stringify(conduct_dates || []), remarks || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, expo_name, status, conduct_dates, remarks } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateExpo = async (req, res) => {
  try {
    const { id } = req.params;
    const { expo_name, status, conduct_dates, remarks } = req.body;
    await pool.query(
      'UPDATE expo_master SET expo_name = ?, status = ?, conduct_dates = ?, remarks = ? WHERE id = ?',
      [expo_name, status, JSON.stringify(conduct_dates || []), remarks || null, id]
    );
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

// GET /master/current-expo — returns the currently selected global expo (or null)
const getCurrentExpo = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, expo_name FROM expo_master WHERE is_current = 1 AND status = "active" LIMIT 1'
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /master/current-expo — admin sets a new global current expo by id (or clears with id=null)
const setCurrentExpo = async (req, res) => {
  try {
    const { id } = req.body; // id = expo id to set as current, or null to clear
    // Clear all first
    await pool.query('UPDATE expo_master SET is_current = 0');
    if (id) {
      await pool.query('UPDATE expo_master SET is_current = 1 WHERE id = ?', [id]);
      const [rows] = await pool.query('SELECT id, expo_name FROM expo_master WHERE id = ?', [id]);
      return res.json({ success: true, data: rows[0] || null, message: 'Current expo updated' });
    }
    res.json({ success: true, data: null, message: 'Current expo cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ENQUIRY TYPES ────────────────────────────────────────────────────────────

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

// ─── INDUSTRY TYPES (Base & Customizable) ──────────────────────────────────────

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

// Get customizable industry types for a specific expo/enquiry_type combo
// If expo_id and enquiry_type provided: return customized list + general
// If only expo_id provided: return expo-specific + general
// If nothing provided: return general only
const getIndustryTypesForContext = async (req, res) => {
  try {
    const { expo_id, enquiry_type_id } = req.query;

    // Always return all general industry types
    const [generalRows] = await pool.query(
      'SELECT id, name FROM industry_types ORDER BY name'
    );

    // Always return custom entries; filter by expo/enquiry if provided
    let customQuery = 'SELECT id, name, expo_id, enquiry_type_id FROM industry_types_custom';
    const cParams = [], conditions = [];
    if (expo_id)         { conditions.push('expo_id = ?');          cParams.push(expo_id); }
    if (enquiry_type_id) { conditions.push('enquiry_type_id = ?');  cParams.push(enquiry_type_id); }
    if (conditions.length) customQuery += ` WHERE ${conditions.join(' AND ')}`;
    customQuery += ' ORDER BY name';

    const [customRows] = await pool.query(customQuery, cParams);

    res.json({ success: true, data: { general: generalRows, custom: customRows } });
  } catch (error) {
    console.error('Get industry types for context error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create or copy industry type to custom level
const createCustomIndustryType = async (req, res) => {
  try {
    const { industry_type_id, expo_id, enquiry_type_id, name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    let finalIndustryTypeId = industry_type_id;
    
    // If copying from general, create a new base entry first
    if (!industry_type_id) {
      const [result] = await pool.query('INSERT INTO industry_types (name) VALUES (?)', [name]);
      finalIndustryTypeId = result.insertId;
    }

    const [customResult] = await pool.query(
      `INSERT INTO industry_types_custom 
       (industry_type_id, expo_id, enquiry_type_id, name, is_general) 
       VALUES (?, ?, ?, ?, 0)`,
      [finalIndustryTypeId, expo_id || null, enquiry_type_id || null, name]
    );

    res.status(201).json({ 
      success: true, 
      data: { id: customResult.insertId, name, expo_id, enquiry_type_id } 
    });
  } catch (error) {
    console.error('Create custom industry type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── SMS TEMPLATES (Base & Customizable) ───────────────────────────────────────

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

// Response: { general: [...], custom: [...] }
const getSmsTemplatesForContext = async (req, res) => {
  try {
    const { expo_id, enquiry_type_id } = req.query;

    const [generalRows] = await pool.query(
      'SELECT id, title, content FROM sms_templates ORDER BY title'
    );

    let customQuery = 'SELECT id, title, content, expo_id, enquiry_type_id FROM sms_templates_custom';
    const cParams = [], conditions = [];
    if (expo_id)         { conditions.push('expo_id = ?');          cParams.push(expo_id); }
    if (enquiry_type_id) { conditions.push('enquiry_type_id = ?');  cParams.push(enquiry_type_id); }
    if (conditions.length) customQuery += ` WHERE ${conditions.join(' AND ')}`;
    customQuery += ' ORDER BY title';

    const [customRows] = await pool.query(customQuery, cParams);

    res.json({ success: true, data: { general: generalRows, custom: customRows } });
  } catch (error) {
    console.error('Get SMS templates for context error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create custom SMS template
const createCustomSmsTemplate = async (req, res) => {
  try {
    const { template_id, expo_id, enquiry_type_id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });

    let finalTemplateId = template_id;
    
    // If not copying from existing, create base template first
    if (!template_id) {
      const [result] = await pool.query('INSERT INTO sms_templates (title, content) VALUES (?, ?)', [title, content]);
      finalTemplateId = result.insertId;
    }

    const [customResult] = await pool.query(
      `INSERT INTO sms_templates_custom 
       (template_id, expo_id, enquiry_type_id, title, content, is_general) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [finalTemplateId, expo_id || null, enquiry_type_id || null, title, content]
    );

    res.status(201).json({ 
      success: true, 
      data: { id: customResult.insertId, title, content, expo_id, enquiry_type_id } 
    });
  } catch (error) {
    console.error('Create custom SMS template error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── WHATSAPP TEMPLATES (Base & Customizable) ──────────────────────────────────

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

// Response: { general: [...], custom: [...] }
const getWhatsappTemplatesForContext = async (req, res) => {
  try {
    const { expo_id, enquiry_type_id } = req.query;

    const [generalRows] = await pool.query(
      'SELECT id, title, content FROM whatsapp_templates ORDER BY title'
    );

    let customQuery = 'SELECT id, title, content, expo_id, enquiry_type_id FROM whatsapp_templates_custom';
    const cParams = [], conditions = [];
    if (expo_id)         { conditions.push('expo_id = ?');          cParams.push(expo_id); }
    if (enquiry_type_id) { conditions.push('enquiry_type_id = ?');  cParams.push(enquiry_type_id); }
    if (conditions.length) customQuery += ` WHERE ${conditions.join(' AND ')}`;
    customQuery += ' ORDER BY title';

    const [customRows] = await pool.query(customQuery, cParams);

    res.json({ success: true, data: { general: generalRows, custom: customRows } });
  } catch (error) {
    console.error('Get WhatsApp templates for context error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create custom WhatsApp template
const createCustomWhatsappTemplate = async (req, res) => {
  try {
    const { template_id, expo_id, enquiry_type_id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });

    let finalTemplateId = template_id;
    
    if (!template_id) {
      const [result] = await pool.query('INSERT INTO whatsapp_templates (title, content) VALUES (?, ?)', [title, content]);
      finalTemplateId = result.insertId;
    }

    const [customResult] = await pool.query(
      `INSERT INTO whatsapp_templates_custom 
       (template_id, expo_id, enquiry_type_id, title, content, is_general) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [finalTemplateId, expo_id || null, enquiry_type_id || null, title, content]
    );

    res.status(201).json({ 
      success: true, 
      data: { id: customResult.insertId, title, content, expo_id, enquiry_type_id } 
    });
  } catch (error) {
    console.error('Create custom WhatsApp template error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── EMAIL TEMPLATES (Base & Customizable) ─────────────────────────────────────

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

// Get email templates for context
const getEmailTemplatesForContext = async (req, res) => {
  try {
    const { expo_id, enquiry_type_id } = req.query;
    let query = `
      SELECT et.id, et.title, et.subject, et.content, 'general' as type, NULL as expo_id, NULL as enquiry_type_id
      FROM email_templates et
    `;
    let params = [];

    if (expo_id || enquiry_type_id) {
      query += ` UNION
        SELECT etc.id, etc.title, etc.subject, etc.content, 'custom' as type, etc.expo_id, etc.enquiry_type_id
        FROM email_templates_custom etc
        WHERE 1=1
      `;
      if (expo_id) {
        query += ` AND etc.expo_id = ?`;
        params.push(expo_id);
      }
      if (enquiry_type_id) {
        query += ` AND etc.enquiry_type_id = ?`;
        params.push(enquiry_type_id);
      }
    }
    query += ` ORDER BY title`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get email templates for context error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create custom email template
const createCustomEmailTemplate = async (req, res) => {
  try {
    const { template_id, expo_id, enquiry_type_id, title, subject, content } = req.body;
    if (!title || !subject || !content) return res.status(400).json({ success: false, message: 'All fields are required' });

    let finalTemplateId = template_id;
    
    if (!template_id) {
      const [result] = await pool.query('INSERT INTO email_templates (title, subject, content) VALUES (?, ?, ?)', [title, subject, content]);
      finalTemplateId = result.insertId;
    }

    const [customResult] = await pool.query(
      `INSERT INTO email_templates_custom 
       (template_id, expo_id, enquiry_type_id, title, subject, content, is_general) 
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [finalTemplateId, expo_id || null, enquiry_type_id || null, title, subject, content]
    );

    res.status(201).json({ 
      success: true, 
      data: { id: customResult.insertId, title, subject, content, expo_id, enquiry_type_id } 
    });
  } catch (error) {
    console.error('Create custom email template error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE CUSTOM ENTRIES ────────────────────────────────────────────────────

const deleteCustomIndustryType = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM industry_types_custom WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCustomSmsTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sms_templates_custom WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCustomWhatsappTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM whatsapp_templates_custom WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  // Sources
  getSources, addSource,
  // Expos
  getExpos, createExpo, updateExpo, deleteExpo, getCurrentExpo, setCurrentExpo,
  // Enquiry Types
  getEnquiryTypes, createEnquiryType, deleteEnquiryType,
  // Industry Types
  getIndustryTypes, createIndustryType, deleteIndustryType, getIndustryTypesForContext, createCustomIndustryType, deleteCustomIndustryType,
  // SMS Templates
  getSmsTemplates, createSmsTemplate, deleteSmsTemplate, getSmsTemplatesForContext, createCustomSmsTemplate, deleteCustomSmsTemplate,
  // WhatsApp Templates
  getWhatsappTemplates, createWhatsappTemplate, deleteWhatsappTemplate, getWhatsappTemplatesForContext, createCustomWhatsappTemplate, deleteCustomWhatsappTemplate,
  // Email Templates
  getEmailTemplates, createEmailTemplate, deleteEmailTemplate, getEmailTemplatesForContext, createCustomEmailTemplate,
};