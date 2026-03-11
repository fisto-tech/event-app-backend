const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  getExpos, createExpo, updateExpo, deleteExpo,
  getEnquiryTypes, createEnquiryType, deleteEnquiryType,
  getIndustryTypes, createIndustryType, deleteIndustryType,
  getSmsTemplates, createSmsTemplate, deleteSmsTemplate,
  getWhatsappTemplates, createWhatsappTemplate, deleteWhatsappTemplate,
  getEmailTemplates, createEmailTemplate, deleteEmailTemplate,
} = require('../controllers/masterController');

// Expos
router.get('/expos', authenticateToken, getExpos);
router.post('/expos', authenticateToken, isAdmin, createExpo);
router.put('/expos/:id', authenticateToken, isAdmin, updateExpo);
router.delete('/expos/:id', authenticateToken, isAdmin, deleteExpo);

// Enquiry Types
router.get('/enquiry-types', authenticateToken, getEnquiryTypes);
router.post('/enquiry-types', authenticateToken, isAdmin, createEnquiryType);
router.delete('/enquiry-types/:id', authenticateToken, isAdmin, deleteEnquiryType);

// Industry Types
router.get('/industry-types', authenticateToken, getIndustryTypes);
router.post('/industry-types', authenticateToken, isAdmin, createIndustryType);
router.delete('/industry-types/:id', authenticateToken, isAdmin, deleteIndustryType);

// SMS Templates
router.get('/sms-templates', authenticateToken, getSmsTemplates);
router.post('/sms-templates', authenticateToken, isAdmin, createSmsTemplate);
router.delete('/sms-templates/:id', authenticateToken, isAdmin, deleteSmsTemplate);

// WhatsApp Templates
router.get('/whatsapp-templates', authenticateToken, getWhatsappTemplates);
router.post('/whatsapp-templates', authenticateToken, isAdmin, createWhatsappTemplate);
router.delete('/whatsapp-templates/:id', authenticateToken, isAdmin, deleteWhatsappTemplate);

// Email Templates
router.get('/email-templates', authenticateToken, getEmailTemplates);
router.post('/email-templates', authenticateToken, isAdmin, createEmailTemplate);
router.delete('/email-templates/:id', authenticateToken, isAdmin, deleteEmailTemplate);

module.exports = router;
