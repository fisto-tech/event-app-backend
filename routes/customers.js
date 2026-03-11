const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getCustomers, createCustomer, updateCustomer, deleteCustomer, syncCustomers } = require('../controllers/customerController');

router.get('/', authenticateToken, getCustomers);
router.post('/', authenticateToken, createCustomer);
router.put('/:id', authenticateToken, updateCustomer);
router.delete('/:id', authenticateToken, deleteCustomer);
router.post('/sync', authenticateToken, syncCustomers);

module.exports = router;
