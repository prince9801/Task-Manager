const { body } = require('express-validator');

const createTaskValidators = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2-150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('project')
    .notEmpty().withMessage('Project is required')
    .isMongoId().withMessage('Invalid project ID'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed']).withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
];

const updateTaskValidators = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2-150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed']).withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Invalid date format'),
];

module.exports = { createTaskValidators, updateTaskValidators };
