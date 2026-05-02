const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');
const { createTaskValidators, updateTaskValidators } = require('../validators/taskValidators');
const validate = require('../middleware/validate');

router.get('/', protect, getTasks);
router.get('/:id', protect, getTask);
router.post('/', protect, adminOnly, createTaskValidators, validate, createTask);
router.put('/:id', protect, updateTaskValidators, validate, updateTask);
router.delete('/:id', protect, adminOnly, deleteTask);

module.exports = router;
