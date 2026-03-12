const pool = require('../config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toBit = (val) =>
  val === true || val === 'true' || val === 1 || val === '1' ? 1 : 0;

// ─── GET followups by date (main page) ───────────────────────────────────────
// Returns:
//   scheduled  → followup_date === selected date, grouped by current_stage
//   missed     → followup_date < selected date and no log entry on that date
const getFollowupsByDate = async (req, res) => {
  try {
    const { date, search, searchField } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0];

    // Build search clause respecting the searchField filter from the frontend
    let searchClause = '';
    let searchParams = [];
    if (search) {
      if (searchField === 'company_name') {
        searchClause = `AND c.company_name LIKE ?`;
        searchParams = [`%${search}%`];
      } else if (searchField === 'customer_name') {
        searchClause = `AND c.customer_name LIKE ?`;
        searchParams = [`%${search}%`];
      } else if (searchField === 'phone_number') {
        searchClause = `AND c.phone_number LIKE ?`;
        searchParams = [`%${search}%`];
      } else {
        // 'all' or unspecified — search all three fields
        searchClause = `AND (c.company_name LIKE ? OR c.customer_name LIKE ? OR c.phone_number LIKE ?)`;
        searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];
      }
    }

    // ── Scheduled: customers whose followup_date = selectedDate ──
    // Use scalar subqueries instead of JOINs to avoid row multiplication
    // when a customer has multiple log entries on the selected date.
    const scheduledQuery = `
      SELECT
        c.id, c.company_name, c.customer_name, c.phone_number,
        c.email, c.designation, c.location, c.city,
        c.industry_type, c.enquiry_type, c.expo_name,
        c.followup_date, c.remarks, c.current_stage,
        c.sms_sent, c.sms_delivered, c.wa_sent, c.wa_delivered,
        c.employee_id, e.name AS employee_name,
        -- latest log: created_at for status colouring (scalar = no row fan-out)
        (SELECT created_at FROM followup_logs
         WHERE customer_id = c.id
         ORDER BY created_at DESC LIMIT 1) AS last_log_date,
        (SELECT next_followup_date FROM followup_logs
         WHERE customer_id = c.id
         ORDER BY created_at DESC LIMIT 1) AS last_next_followup,
        -- whether ANY log was recorded on the selected date (1 = done, NULL = not yet)
        (SELECT id FROM followup_logs
         WHERE customer_id = c.id
           AND DATE(created_at) = ?
         ORDER BY id DESC LIMIT 1) AS log_on_selected_date_id
      FROM customers c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.followup_date = ?
      ${searchClause}
      ORDER BY c.company_name ASC
    `;
    const [scheduled] = await pool.query(scheduledQuery, [
      selectedDate,
      selectedDate,
      ...searchParams,
    ]);

    // ── Missed: followup_date < selectedDate AND no log on that followup_date ──
    const missedQuery = `
      SELECT
        c.id, c.company_name, c.customer_name, c.phone_number,
        c.email, c.designation, c.location, c.city,
        c.industry_type, c.enquiry_type, c.expo_name,
        c.followup_date, c.remarks, c.current_stage,
        c.sms_sent, c.sms_delivered, c.wa_sent, c.wa_delivered,
        c.employee_id, e.name AS employee_name,
        (SELECT created_at FROM followup_logs
         WHERE customer_id = c.id
         ORDER BY created_at DESC LIMIT 1) AS last_log_date,
        (SELECT next_followup_date FROM followup_logs
         WHERE customer_id = c.id
         ORDER BY created_at DESC LIMIT 1) AS last_next_followup
      FROM customers c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.followup_date < ?
        AND NOT EXISTS (
          SELECT 1 FROM followup_logs
          WHERE customer_id = c.id
            AND DATE(created_at) = c.followup_date
        )
      ${searchClause}
      ORDER BY c.followup_date ASC, c.company_name ASC
    `;
    const [missed] = await pool.query(missedQuery, [
      selectedDate,
      ...searchParams,
    ]);

    // Group scheduled by stage
    const stages = ['first_followup', 'proposal', 'lead', 'confirm'];
    const grouped = {};
    stages.forEach((s) => (grouped[s] = []));
    scheduled.forEach((row) => {
      const stage = row.current_stage || 'first_followup';
      if (grouped[stage]) grouped[stage].push(row);
      else grouped['first_followup'].push(row);
    });

    res.json({
      success: true,
      data: {
        date: selectedDate,
        grouped,
        missed,
      },
    });
  } catch (error) {
    console.error('getFollowupsByDate error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET single customer detail for followup page ────────────────────────────
const getFollowupDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT c.*, e.name AS employee_name,
              em.expo_name AS expo_name_master
       FROM customers c
       LEFT JOIN employees   e  ON c.employee_id = e.id
       LEFT JOIN expo_master em ON c.expo_id     = em.id
       WHERE c.id = ?`,
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Customer not found' });

    // Distinct contacts from past logs
    const [contacts] = await pool.query(
      `SELECT DISTINCT contact_name, contact_designation,
              contact_phone, contact_email
       FROM followup_logs
       WHERE customer_id = ?
       ORDER BY id DESC`,
      [id]
    );

    // Latest log (for share lock check)
    const [latestLog] = await pool.query(
      `SELECT * FROM followup_logs WHERE customer_id = ? ORDER BY id DESC LIMIT 1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        customer: rows[0],
        contacts,
        latestLog: latestLog[0] || null,
      },
    });
  } catch (error) {
    console.error('getFollowupDetail error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET history for a customer ───────────────────────────────────────────────
const getFollowupHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT fl.*, e.name AS employee_name
       FROM followup_logs fl
       LEFT JOIN employees e ON fl.employee_id = e.id
       WHERE fl.customer_id = ?
       ORDER BY fl.created_at DESC`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getFollowupHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── CREATE followup log entry ────────────────────────────────────────────────
const createFollowupLog = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { customer_id } = req.params;
    const {
      contact_name, contact_designation, contact_phone, contact_email,
      followup_stage, remarks, next_followup_date,
      share_whatsapp, share_email,
    } = req.body;

    if (!contact_name || !contact_phone) {
      await conn.rollback();
      conn.release();
      return res
        .status(400)
        .json({ success: false, message: 'Contact name and phone are required' });
    }

    const employee_id = req.user.id;

    // Check if shares are already locked for this customer
    const [[lockCheck]] = await conn.query(
      `SELECT shares_locked FROM followup_logs
       WHERE customer_id = ? ORDER BY id DESC LIMIT 1`,
      [customer_id]
    );
    const alreadyLocked = lockCheck?.shares_locked === 1;

    const sharesLocked =
      alreadyLocked || toBit(share_whatsapp) || toBit(share_email) ? 1 : 0;

    // Insert log
    const [result] = await conn.query(
      `INSERT INTO followup_logs
         (customer_id, contact_name, contact_designation, contact_phone,
          contact_email, followup_stage, remarks, next_followup_date,
          share_whatsapp, share_email, shares_locked, employee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        contact_name, contact_designation || null, contact_phone,
        contact_email || null,
        followup_stage || 'first_followup',
        remarks || null,
        next_followup_date || null,
        alreadyLocked ? (lockCheck.share_whatsapp ?? 0) : toBit(share_whatsapp),
        alreadyLocked ? (lockCheck.share_email ?? 0) : toBit(share_email),
        sharesLocked,
        employee_id,
      ]
    );

    // Update customers table
    await conn.query(
      `UPDATE customers
       SET current_stage    = ?,
           followup_date    = ?,
           remarks          = ?
       WHERE id = ?`,
      [
        followup_stage || 'first_followup',
        next_followup_date || null,
        remarks || null,
        customer_id,
      ]
    );

    await conn.commit();
    conn.release();

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Follow-up logged successfully',
    });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('createFollowupLog error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADMIN: missed followups ──────────────────────────────────────────────────
const getAdminMissedFollowups = async (req, res) => {
  try {
    const { search, stage, employee_id: empFilter } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT
        c.id, c.company_name, c.customer_name, c.phone_number,
        c.email, c.followup_date, c.current_stage, c.remarks,
        e.name AS employee_name, c.employee_id
      FROM customers c
      LEFT JOIN employees e ON c.employee_id = e.id
      WHERE c.followup_date < ?
        AND NOT EXISTS (
          SELECT 1 FROM followup_logs
          WHERE customer_id = c.id
            AND DATE(created_at) = c.followup_date
        )
    `;
    const params = [today];

    if (search) {
      query += ` AND (c.company_name LIKE ? OR c.customer_name LIKE ? OR c.phone_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (stage) { query += ` AND c.current_stage = ?`; params.push(stage); }
    if (empFilter) { query += ` AND c.employee_id = ?`; params.push(empFilter); }

    query += ` ORDER BY c.followup_date ASC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getAdminMissedFollowups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getFollowupsByDate,
  getFollowupDetail,
  getFollowupHistory,
  createFollowupLog,
  getAdminMissedFollowups,
};