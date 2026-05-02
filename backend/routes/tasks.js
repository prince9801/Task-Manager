const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect, adminOnly, adminOrAssigned } = require('../middleware/auth');
const validate = require('../middleware/validate');

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('project').notEmpty().withMessage('Project is required'),
];

router.get('/', protect, getTasks);
router.get('/:id', protect, getTask);
router.post('/', protect, adminOnly, taskValidation, validate, createTask);
router.put('/:id', protect, adminOrAssigned, updateTask);
router.delete('/:id', protect, adminOnly, deleteTask);

module.exports = router;
