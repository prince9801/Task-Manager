const { body, param } = require('express-validator');

const createProjectValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
];

const updateProjectValidators = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status'),
];

module.exports = { createProjectValidators, updateProjectValidators };
