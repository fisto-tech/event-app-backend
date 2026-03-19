const pool = require('../config/db');

// ─── SOURCES ──────────────────────────────────────────────────────────────────

const getSources = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sources ORDER BY source_name');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addSource = async (req, res) => {
  try {
    const { source_name } = req.body;
    if (!source_name || !source_name.trim())
      return res.status(400).json({ success: false, message: 'Source name is required' });
    const trimmedName = source_name.trim();
    const [existing] = await pool.query('SELECT id FROM sources WHERE source_name = ?', [trimmedName]);
    if (existing.length > 0)
      return res.json({ success: true, data: { id: existing[0].id, source_name: trimmedName }, message: 'Source already exists' });
    const [result] = await pool.query('INSERT INTO sources (source_name) VALUES (?)', [trimmedName]);
    res.status(201).json({ success: true, data: { id: result.insertId, source_name: trimmedName } });
  } catch (error) {
    console.error('Add source error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── EXPO NAMES ───────────────────────────────────────────────────────────────

const getExpos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expo_master WHERE status = "active" ORDER BY expo_name');
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
    let query = 'UPDATE expo_master SET expo_name = ?';
    const params = [expo_name];
    if (status !== undefined) {
      query += ', status = ?';
      params.push(status);
    }
    query += ', conduct_dates = ?, remarks = ? WHERE id = ?';
    params.push(JSON.stringify(conduct_dates || []), remarks || null, id);
    await pool.query(query, params);
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

const getCurrentExpo = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, expo_name FROM expo_master WHERE is_current = 1 AND status = "active" LIMIT 1');
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const setCurrentExpo = async (req, res) => {
  try {
    const { id } = req.body;
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

// ─── ENQUIRY TYPES — enquiry_types_custom table ONLY ─────────────────────────
// All enquiry type entries live in enquiry_types_custom.
// expo_id = NULL means "General" (available to all expos).
// expo_id = <id> means specific to that expo.

const getEnquiryTypes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT etc.id, etc.name, etc.expo_id, em.expo_name
       FROM enquiry_types_custom etc
       LEFT JOIN expo_master em ON em.id = etc.expo_id
       ORDER BY etc.name`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createEnquiryType = async (req, res) => {
  try {
    const { name, expo_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const [result] = await pool.query(
      'INSERT INTO enquiry_types_custom (name, expo_id) VALUES (?, ?)',
      [name, expo_id || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, name, expo_id: expo_id || null } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteEnquiryType = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM enquiry_types_custom WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateEnquiryType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, expo_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    await pool.query('UPDATE enquiry_types_custom SET name = ?, expo_id = ? WHERE id = ?', [name, expo_id || null, id]);
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── INDUSTRY TYPES — industry_types_custom table ONLY ───────────────────────
// All industry type entries live in industry_types_custom.
// expo_id = NULL means "General" (available to all expos).
// expo_id = <id> means specific to that expo.

const getIndustryTypes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT itc.id, itc.name, itc.expo_id, em.expo_name
       FROM industry_types_custom itc
       LEFT JOIN expo_master em ON em.id = itc.expo_id
       ORDER BY itc.name`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createIndustryType = async (req, res) => {
  try {
    const { name, expo_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const [result] = await pool.query(
      'INSERT INTO industry_types_custom (name, expo_id) VALUES (?, ?)',
      [name, expo_id || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, name, expo_id: expo_id || null } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteIndustryType = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM industry_types_custom WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateIndustryType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, expo_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    await pool.query('UPDATE industry_types_custom SET name = ?, expo_id = ? WHERE id = ?', [name, expo_id || null, id]);
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
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

const updateSmsTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    await pool.query('UPDATE sms_templates SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /master/sms-templates/context
// enquiryTypes: general (expo_id IS NULL) always + expo-specific if expo_id provided (from enquiry_types_custom)
// industryTypes: general (expo_id IS NULL) always + expo-specific if expo_id provided (from industry_types_custom)
const getSmsTemplatesForContext = async (req, res) => {
  try {
    const { expo_id, enquiry_type_id, industry_type_id } = req.query;

    const [generalRows] = await pool.query('SELECT id, title, content FROM sms_templates ORDER BY title');

    let customQuery = 'SELECT id, title, content, expo_id, enquiry_type_id, industry_type_id FROM sms_templates_custom';
    const cParams = [], conditions = [];
    if (expo_id)          { conditions.push('expo_id = ?');           cParams.push(expo_id); }
    if (enquiry_type_id)  { conditions.push('enquiry_type_id = ?');   cParams.push(enquiry_type_id); }
    if (industry_type_id) { conditions.push('industry_type_id = ?');  cParams.push(industry_type_id); }
    if (conditions.length) customQuery += ` WHERE ${conditions.join(' AND ')}`;
    customQuery += ' ORDER BY title';
    const [customRows] = await pool.query(customQuery, cParams);

    // Enquiry types: general (NULL) always; add expo-specific when expo chosen
    let enquiryQuery = 'SELECT id, name, expo_id FROM enquiry_types_custom WHERE expo_id IS NULL';
    const eqParams = [];
    if (expo_id) {
      enquiryQuery = `SELECT id, name, expo_id FROM enquiry_types_custom WHERE expo_id IS NULL
                      UNION
                      SELECT id, name, expo_id FROM enquiry_types_custom WHERE expo_id = ?`;
      eqParams.push(expo_id);
    }
    enquiryQuery += ' ORDER BY name';
    const [enquiryTypeRows] = await pool.query(enquiryQuery, eqParams);

    // Industry types: general (NULL) always; add expo-specific when expo chosen
    let industryQuery = 'SELECT id, name, expo_id FROM industry_types_custom WHERE expo_id IS NULL';
    const indParams = [];
    if (expo_id) {
      industryQuery = `SELECT id, name, expo_id FROM industry_types_custom WHERE expo_id IS NULL
                       UNION
                       SELECT id, name, expo_id FROM industry_types_custom WHERE expo_id = ?`;
      indParams.push(expo_id);
    }
    industryQuery += ' ORDER BY name';
    const [industryTypeRows] = await pool.query(industryQuery, indParams);

    res.json({
      success: true,
      data: {
        general: generalRows,
        custom: customRows,
        enquiryTypes: enquiryTypeRows,
        industryTypes: industryTypeRows,
      }
    });
  } catch (error) {
    console.error('Get SMS templates for context error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCustomSmsTemplate = async (req, res) => {
  try {
    const { template_id, expo_id, enquiry_type_id, industry_type_id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    let finalTemplateId = template_id;
    if (!template_id) {
      const [result] = await pool.query('INSERT INTO sms_templates (title, content) VALUES (?, ?)', [title, content]);
      finalTemplateId = result.insertId;
    }
    const [customResult] = await pool.query(
      `INSERT INTO sms_templates_custom (template_id, expo_id, enquiry_type_id, industry_type_id, title, content, is_general)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [finalTemplateId, expo_id || null, enquiry_type_id || null, industry_type_id || null, title, content]
    );
    res.status(201).json({
      success: true,
      data: { id: customResult.insertId, title, content, expo_id, enquiry_type_id, industry_type_id }
    });
  } catch (error) {
    console.error('Create custom SMS template error:', error);
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

const updateCustomSmsTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, expo_id, enquiry_type_id, industry_type_id } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    await pool.query(
      'UPDATE sms_templates_custom SET title = ?, content = ?, expo_id = ?, enquiry_type_id = ?, industry_type_id = ? WHERE id = ?',
      [title, content, expo_id || null, enquiry_type_id || null, industry_type_id || null, id]
    );
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    console.error('Update custom SMS template error:', error);
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

const updateWhatsappTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    await pool.query('UPDATE whatsapp_templates SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getWhatsappTemplatesForContext = async (req, res) => {
  try {
    const { expo_id, enquiry_type_id, industry_type_id } = req.query;

    const [generalRows] = await pool.query('SELECT id, title, content FROM whatsapp_templates ORDER BY title');

    let customQuery = 'SELECT id, title, content, expo_id, enquiry_type_id, industry_type_id FROM whatsapp_templates_custom';
    const cParams = [], conditions = [];
    if (expo_id)          { conditions.push('expo_id = ?');           cParams.push(expo_id); }
    if (enquiry_type_id)  { conditions.push('enquiry_type_id = ?');   cParams.push(enquiry_type_id); }
    if (industry_type_id) { conditions.push('industry_type_id = ?');  cParams.push(industry_type_id); }
    if (conditions.length) customQuery += ` WHERE ${conditions.join(' AND ')}`;
    customQuery += ' ORDER BY title';
    const [customRows] = await pool.query(customQuery, cParams);

    // Enquiry types: general (NULL) always; add expo-specific when expo chosen
    let enquiryQuery = 'SELECT id, name, expo_id FROM enquiry_types_custom WHERE expo_id IS NULL';
    const eqParams = [];
    if (expo_id) {
      enquiryQuery = `SELECT id, name, expo_id FROM enquiry_types_custom WHERE expo_id IS NULL
                      UNION
                      SELECT id, name, expo_id FROM enquiry_types_custom WHERE expo_id = ?`;
      eqParams.push(expo_id);
    }
    enquiryQuery += ' ORDER BY name';
    const [enquiryTypeRows] = await pool.query(enquiryQuery, eqParams);

    // Industry types: general (NULL) always; add expo-specific when expo chosen
    let industryQuery = 'SELECT id, name, expo_id FROM industry_types_custom WHERE expo_id IS NULL';
    const indParams = [];
    if (expo_id) {
      industryQuery = `SELECT id, name, expo_id FROM industry_types_custom WHERE expo_id IS NULL
                       UNION
                       SELECT id, name, expo_id FROM industry_types_custom WHERE expo_id = ?`;
      indParams.push(expo_id);
    }
    industryQuery += ' ORDER BY name';
    const [industryTypeRows] = await pool.query(industryQuery, indParams);

    res.json({
      success: true,
      data: {
        general: generalRows,
        custom: customRows,
        enquiryTypes: enquiryTypeRows,
        industryTypes: industryTypeRows,
      }
    });
  } catch (error) {
    console.error('Get WhatsApp templates for context error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCustomWhatsappTemplate = async (req, res) => {
  try {
    const { template_id, expo_id, enquiry_type_id, industry_type_id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    let finalTemplateId = template_id;
    if (!template_id) {
      const [result] = await pool.query('INSERT INTO whatsapp_templates (title, content) VALUES (?, ?)', [title, content]);
      finalTemplateId = result.insertId;
    }
    const [customResult] = await pool.query(
      `INSERT INTO whatsapp_templates_custom (template_id, expo_id, enquiry_type_id, industry_type_id, title, content, is_general)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [finalTemplateId, expo_id || null, enquiry_type_id || null, industry_type_id || null, title, content]
    );
    res.status(201).json({
      success: true,
      data: { id: customResult.insertId, title, content, expo_id, enquiry_type_id, industry_type_id }
    });
  } catch (error) {
    console.error('Create custom WhatsApp template error:', error);
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

const updateCustomWhatsappTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, expo_id, enquiry_type_id, industry_type_id } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' });
    await pool.query(
      'UPDATE whatsapp_templates_custom SET title = ?, content = ?, expo_id = ?, enquiry_type_id = ?, industry_type_id = ? WHERE id = ?',
      [title, content, expo_id || null, enquiry_type_id || null, industry_type_id || null, id]
    );
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    console.error('Update custom WhatsApp template error:', error);
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

const getEmailTemplatesForContext = async (req, res) => {
  try {
    const { expo_id, enquiry_type_id } = req.query;
    let query = `SELECT et.id, et.title, et.subject, et.content, 'general' as type, NULL as expo_id, NULL as enquiry_type_id FROM email_templates et`;
    let params = [];
    if (expo_id || enquiry_type_id) {
      query += ` UNION SELECT etc.id, etc.title, etc.subject, etc.content, 'custom' as type, etc.expo_id, etc.enquiry_type_id FROM email_templates_custom etc WHERE 1=1`;
      if (expo_id)         { query += ` AND etc.expo_id = ?`;         params.push(expo_id); }
      if (enquiry_type_id) { query += ` AND etc.enquiry_type_id = ?`; params.push(enquiry_type_id); }
    }
    query += ` ORDER BY title`;
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get email templates for context error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
      `INSERT INTO email_templates_custom (template_id, expo_id, enquiry_type_id, title, subject, content, is_general) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [finalTemplateId, expo_id || null, enquiry_type_id || null, title, subject, content]
    );
    res.status(201).json({ success: true, data: { id: customResult.insertId, title, subject, content, expo_id, enquiry_type_id } });
  } catch (error) {
    console.error('Create custom email template error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSources, addSource,
  getExpos, createExpo, updateExpo, deleteExpo, getCurrentExpo, setCurrentExpo,
  // Enquiry Types — enquiry_types_custom only
  getEnquiryTypes, createEnquiryType, updateEnquiryType, deleteEnquiryType,
  // Industry Types — industry_types_custom only
  getIndustryTypes, createIndustryType, updateIndustryType, deleteIndustryType,
  // SMS Templates
  getSmsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate, getSmsTemplatesForContext, createCustomSmsTemplate, deleteCustomSmsTemplate, updateCustomSmsTemplate,
  // WhatsApp Templates
  getWhatsappTemplates, createWhatsappTemplate, updateWhatsappTemplate, deleteWhatsappTemplate, getWhatsappTemplatesForContext, createCustomWhatsappTemplate, deleteCustomWhatsappTemplate, updateCustomWhatsappTemplate,
  // Email Templates
  getEmailTemplates, createEmailTemplate, deleteEmailTemplate, getEmailTemplatesForContext, createCustomEmailTemplate,
};