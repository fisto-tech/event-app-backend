const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  getSources, addSource,
  getExpos, createExpo, updateExpo, deleteExpo, getCurrentExpo, setCurrentExpo,
  getEnquiryTypes, createEnquiryType, updateEnquiryType, deleteEnquiryType,
  getIndustryTypes, createIndustryType, updateIndustryType, deleteIndustryType,
  getSmsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate, getSmsTemplatesForContext, createCustomSmsTemplate, deleteCustomSmsTemplate, updateCustomSmsTemplate,
  getWhatsappTemplates, createWhatsappTemplate, updateWhatsappTemplate, deleteWhatsappTemplate, getWhatsappTemplatesForContext, createCustomWhatsappTemplate, deleteCustomWhatsappTemplate, updateCustomWhatsappTemplate,
  getEmailTemplates, createEmailTemplate, deleteEmailTemplate, getEmailTemplatesForContext, createCustomEmailTemplate,
} = require('../controllers/masterController');

// ─── SOURCES ──────────────────────────────────────────────────────────────────
router.get('/sources', authenticateToken, getSources);
router.post('/sources', authenticateToken, addSource);

// ─── EXPOS ────────────────────────────────────────────────────────────────────
router.get('/expos', authenticateToken, getExpos);
router.post('/expos', authenticateToken, isAdmin, createExpo);
router.put('/expos/:id', authenticateToken, isAdmin, updateExpo);
router.delete('/expos/:id', authenticateToken, isAdmin, deleteExpo);

// ─── CURRENT EXPO ─────────────────────────────────────────────────────────────
router.get('/current-expo', authenticateToken, getCurrentExpo);
router.put('/current-expo', authenticateToken, isAdmin, setCurrentExpo);

// ─── ENQUIRY TYPES (industry_types_custom only — expo-scoped) ───────────────
router.get('/enquiry-types', authenticateToken, getEnquiryTypes);
router.post('/enquiry-types', authenticateToken, isAdmin, createEnquiryType);
router.put('/enquiry-types/:id', authenticateToken, isAdmin, updateEnquiryType);
router.delete('/enquiry-types/:id', authenticateToken, isAdmin, deleteEnquiryType);

// ─── INDUSTRY TYPES (industry_types_custom only — expo-scoped) ───────────────
router.get('/industry-types', authenticateToken, getIndustryTypes);
router.post('/industry-types', authenticateToken, isAdmin, createIndustryType);
router.put('/industry-types/:id', authenticateToken, isAdmin, updateIndustryType);
router.delete('/industry-types/:id', authenticateToken, isAdmin, deleteIndustryType);

// ─── SMS TEMPLATES ────────────────────────────────────────────────────────────
router.get('/sms-templates', authenticateToken, getSmsTemplates);
router.post('/sms-templates', authenticateToken, isAdmin, createSmsTemplate);
router.get('/sms-templates/context', authenticateToken, getSmsTemplatesForContext);
router.post('/sms-templates/custom', authenticateToken, isAdmin, createCustomSmsTemplate);
router.put('/sms-templates/custom/:id', authenticateToken, isAdmin, updateCustomSmsTemplate);
router.delete('/sms-templates/custom/:id', authenticateToken, isAdmin, deleteCustomSmsTemplate);
router.put('/sms-templates/:id', authenticateToken, isAdmin, updateSmsTemplate);
router.delete('/sms-templates/:id', authenticateToken, isAdmin, deleteSmsTemplate);

// ─── WHATSAPP TEMPLATES ───────────────────────────────────────────────────────
router.get('/whatsapp-templates', authenticateToken, getWhatsappTemplates);
router.post('/whatsapp-templates', authenticateToken, isAdmin, createWhatsappTemplate);
router.get('/whatsapp-templates/context', authenticateToken, getWhatsappTemplatesForContext);
router.post('/whatsapp-templates/custom', authenticateToken, isAdmin, createCustomWhatsappTemplate);
router.put('/whatsapp-templates/custom/:id', authenticateToken, isAdmin, updateCustomWhatsappTemplate);
router.delete('/whatsapp-templates/custom/:id', authenticateToken, isAdmin, deleteCustomWhatsappTemplate);
router.put('/whatsapp-templates/:id', authenticateToken, isAdmin, updateWhatsappTemplate);
router.delete('/whatsapp-templates/:id', authenticateToken, isAdmin, deleteWhatsappTemplate);

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────
router.get('/email-templates', authenticateToken, getEmailTemplates);
router.post('/email-templates', authenticateToken, isAdmin, createEmailTemplate);
router.get('/email-templates/context', authenticateToken, getEmailTemplatesForContext);
router.post('/email-templates/custom', authenticateToken, isAdmin, createCustomEmailTemplate);
router.delete('/email-templates/:id', authenticateToken, isAdmin, deleteEmailTemplate);

module.exports = router;