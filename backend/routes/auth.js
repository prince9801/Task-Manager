const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, getUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.get('/users', protect, adminOnly, getUsers);

module.exports = router;
