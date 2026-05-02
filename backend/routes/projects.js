const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
];

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.post('/', protect, adminOnly, projectValidation, validate, createProject);
router.put('/:id', protect, adminOnly, updateProject);
router.delete('/:id', protect, adminOnly, deleteProject);
router.post('/:id/members', protect, adminOnly, addMember);
router.delete('/:id/members/:userId', protect, adminOnly, removeMember);

module.exports = router;
