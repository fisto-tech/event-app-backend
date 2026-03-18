const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/masterController');

// ─── SOURCES (from "Others" dropdown) ──────────────────────────────────────────
router.get('/sources', authenticateToken, getSources);
router.post('/sources', authenticateToken, addSource);

// ─── EXPOS ────────────────────────────────────────────────────────────────────
router.get('/expos', authenticateToken, getExpos);
router.post('/expos', authenticateToken, isAdmin, createExpo);
router.put('/expos/:id', authenticateToken, isAdmin, updateExpo);
router.delete('/expos/:id', authenticateToken, isAdmin, deleteExpo);

// ─── CURRENT EXPO (global selection, readable by all, writable by admin) ──────
router.get('/current-expo', authenticateToken, getCurrentExpo);
router.put('/current-expo', authenticateToken, isAdmin, setCurrentExpo);

// ─── ENQUIRY TYPES ────────────────────────────────────────────────────────────
router.get('/enquiry-types', authenticateToken, getEnquiryTypes);
router.post('/enquiry-types', authenticateToken, isAdmin, createEnquiryType);
router.delete('/enquiry-types/:id', authenticateToken, isAdmin, deleteEnquiryType);

// ─── INDUSTRY TYPES (Base & Customizable) ──────────────────────────────────────
router.get('/industry-types', authenticateToken, getIndustryTypes);
router.post('/industry-types', authenticateToken, isAdmin, createIndustryType);
router.delete('/industry-types/:id', authenticateToken, isAdmin, deleteIndustryType);
router.get('/industry-types/context', authenticateToken, getIndustryTypesForContext);
router.post('/industry-types/custom', authenticateToken, isAdmin, createCustomIndustryType);
router.delete('/industry-types/custom/:id', authenticateToken, isAdmin, deleteCustomIndustryType);

// ─── SMS TEMPLATES (Base & Customizable) ───────────────────────────────────────
router.get('/sms-templates', authenticateToken, getSmsTemplates);
router.post('/sms-templates', authenticateToken, isAdmin, createSmsTemplate);
router.delete('/sms-templates/:id', authenticateToken, isAdmin, deleteSmsTemplate);
router.get('/sms-templates/context', authenticateToken, getSmsTemplatesForContext);
router.post('/sms-templates/custom', authenticateToken, isAdmin, createCustomSmsTemplate);
router.delete('/sms-templates/custom/:id', authenticateToken, isAdmin, deleteCustomSmsTemplate);

// ─── WHATSAPP TEMPLATES (Base & Customizable) ──────────────────────────────────
router.get('/whatsapp-templates', authenticateToken, getWhatsappTemplates);
router.post('/whatsapp-templates', authenticateToken, isAdmin, createWhatsappTemplate);
router.delete('/whatsapp-templates/:id', authenticateToken, isAdmin, deleteWhatsappTemplate);
router.get('/whatsapp-templates/context', authenticateToken, getWhatsappTemplatesForContext);
router.post('/whatsapp-templates/custom', authenticateToken, isAdmin, createCustomWhatsappTemplate);
router.delete('/whatsapp-templates/custom/:id', authenticateToken, isAdmin, deleteCustomWhatsappTemplate);

// ─── EMAIL TEMPLATES (Base & Customizable) ────────────────────────────────────
router.get('/email-templates', authenticateToken, getEmailTemplates);
router.post('/email-templates', authenticateToken, isAdmin, createEmailTemplate);
router.delete('/email-templates/:id', authenticateToken, isAdmin, deleteEmailTemplate);
router.get('/email-templates/context', authenticateToken, getEmailTemplatesForContext);
router.post('/email-templates/custom', authenticateToken, isAdmin, createCustomEmailTemplate);

module.exports = router;