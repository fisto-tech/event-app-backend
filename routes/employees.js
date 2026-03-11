const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getEmployees, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');

router.get('/', authenticateToken, isAdmin, getEmployees);
router.post('/', authenticateToken, isAdmin, createEmployee);
router.put('/:id', authenticateToken, isAdmin, updateEmployee);
router.delete('/:id', authenticateToken, isAdmin, deleteEmployee);

module.exports = router;
