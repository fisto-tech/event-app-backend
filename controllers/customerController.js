const pool = require('../config/db');

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// Convert JS boolean / string "true"/"false" to MySQL 0/1
const toBit = (val) => (val === true || val === 'true' || val === 1 || val === '1' ? 1 : 0);

// ─── GET all customers ────────────────────────────────────────────────────────
const getCustomers = async (req, res) => {
  try {
    const { search, search_field, expo_id, industry_type, enquiry_type } = req.query;
    let query = `
      SELECT c.*, e.name AS employee_name, em.expo_name AS expo_name_master
      FROM customers c
      LEFT JOIN employees   e  ON c.employee_id = e.id
      LEFT JOIN expo_master em ON c.expo_id     = em.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      // Map frontend field keys to DB column names
      const FIELD_MAP = {
        customer_name: 'c.customer_name',
        company_name:  'c.company_name',
        designation:   'c.designation',
        phone_number:  'c.phone_number',
        email:         'c.email',
        city:          'c.city',
        location:      'c.location',
        website:       'c.website',
      };
      const col = search_field && FIELD_MAP[search_field] ? FIELD_MAP[search_field] : null;

      if (col) {
        // Search in specific field only
        query += ` AND ${col} LIKE ?`;
        params.push(`%${search}%`);
      } else {
        // All fields (default)
        query += ` AND (c.customer_name LIKE ? OR c.company_name LIKE ? OR c.designation LIKE ? OR c.phone_number LIKE ? OR c.email LIKE ? OR c.city LIKE ? OR c.location LIKE ? OR c.website LIKE ?)`;
        params.push(...Array(8).fill(`%${search}%`));
      }
    }
    if (expo_id)       { query += ` AND c.expo_id = ?`;        params.push(expo_id); }
    if (industry_type) { query += ` AND c.industry_type = ?`;  params.push(industry_type); }
    if (enquiry_type)  { query += ` AND c.enquiry_type = ?`;   params.push(enquiry_type); }

    query += ` ORDER BY c.id DESC`;

    const [rows] = await pool.query(query, params);
    // Parse JSON additional_contacts for each row
    const data = rows.map((r) => ({
      ...r,
      additional_contacts: r.additional_contacts
        ? (typeof r.additional_contacts === 'string' ? JSON.parse(r.additional_contacts) : r.additional_contacts)
        : [],
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── CREATE customer ──────────────────────────────────────────────────────────
const createCustomer = async (req, res) => {
  try {
    const {
      expo_id, expo_name, company_name, customer_name, designation,
      phone_number, mobile_no_2, enquiry_type, email, email_2, website,
      location, city, industry_type, followup_date, remarks,
      sms_sent, wa_sent, additional_contacts,
    } = req.body;

    if (!company_name || !customer_name || !phone_number) {
      return res.status(400).json({ success: false, message: 'Company name, customer name, and phone are required' });
    }

    const employee_id = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO customers
         (expo_id, expo_name, company_name, customer_name, designation,
          phone_number, mobile_no_2, enquiry_type, email, email_2, website,
          location, city, industry_type, followup_date, remarks, employee_id,
          sms_sent, wa_sent, additional_contacts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expo_id || null, expo_name || null, company_name, customer_name, designation || null,
        phone_number, mobile_no_2 || null, enquiry_type || null, email || null, email_2 || null,
        website || null, location || null, city || null, industry_type || null,
        followup_date || null, remarks || null, employee_id,
        toBit(sms_sent), toBit(wa_sent),
        additional_contacts ? JSON.stringify(additional_contacts) : null,
      ]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Customer registered successfully',
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ─── UPDATE customer ──────────────────────────────────────────────────────────
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      expo_id, expo_name, company_name, customer_name, designation,
      phone_number, mobile_no_2, enquiry_type, email, email_2, website,
      location, city, industry_type, followup_date, remarks,
      sms_sent, wa_sent, additional_contacts,
    } = req.body;

    await pool.query(
      `UPDATE customers
       SET expo_id=?, expo_name=?, company_name=?, customer_name=?, designation=?,
           phone_number=?, mobile_no_2=?, enquiry_type=?, email=?, email_2=?,
           website=?, location=?, city=?, industry_type=?, followup_date=?, remarks=?,
           sms_sent=?, wa_sent=?, additional_contacts=?
       WHERE id=?`,
      [
        expo_id || null, expo_name || null, company_name, customer_name, designation || null,
        phone_number, mobile_no_2 || null, enquiry_type || null, email || null, email_2 || null,
        website || null, location || null, city || null, industry_type || null,
        followup_date || null, remarks || null,
        toBit(sms_sent), toBit(wa_sent),
        additional_contacts ? JSON.stringify(additional_contacts) : null,
        id,
      ]
    );

    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE customer ──────────────────────────────────────────────────────────
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── BULK SYNC (offline records) ──────────────────────────────────────────────
const syncCustomers = async (req, res) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Records array is required' });
    }

    const employee_id = req.user.id;
    const syncedIds = [];

    for (const record of records) {
      const {
        local_id,
        expo_id,
        expo_name,
        company_name,
        customer_name,
        designation,
        phone_number,
        mobile_no_2,
        enquiry_type,
        email,
        email_2,
        website,
        location,
        city,
        industry_type,
        followup_date,
        remarks,
        created_at,
        sms_sent,
        wa_sent,
        additional_contacts,
      } = record;

      const [result] = await pool.query(
        `INSERT INTO customers
           (expo_id, expo_name, company_name, customer_name, designation,
            phone_number, mobile_no_2, enquiry_type, email, email_2, website,
            location, city, industry_type, followup_date, remarks, employee_id,
            created_at, sms_sent, wa_sent, additional_contacts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expo_id || null,
          expo_name || null,
          company_name,
          customer_name,
          designation || null,
          phone_number,
          mobile_no_2 || null,
          enquiry_type || null,
          email || null,
          email_2 || null,
          website || null,
          location || null,
          city || null,
          industry_type || null,
          followup_date || null,
          remarks || null,
          employee_id,
          created_at || new Date(),
          toBit(sms_sent),
          toBit(wa_sent),
          additional_contacts ? JSON.stringify(additional_contacts) : null,
        ]
      );
      syncedIds.push({ local_id, server_id: result.insertId });
    }

    res.json({
      success: true,
      synced: syncedIds,
      message: `${syncedIds.length} record(s) synced`,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, message: error.message || 'Sync failed' });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  syncCustomers,
};