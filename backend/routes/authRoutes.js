const express = require('express');
const router = express.Router();
const { signup, login, getMe, getUsers, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { signupValidators, loginValidators } = require('../validators/authValidators');
const validate = require('../middleware/validate');

router.post('/signup', signupValidators, validate, signup);
router.post('/login', loginValidators, validate, login);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);
router.put('/profile', protect, updateProfile);

module.exports = router;
