const express = require('express');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject, deleteProject,
  addMember, removeMember
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');
const { createProjectValidators, updateProjectValidators } = require('../validators/projectValidators');
const validate = require('../middleware/validate');

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.post('/', protect, adminOnly, createProjectValidators, validate, createProject);
router.put('/:id', protect, adminOnly, updateProjectValidators, validate, updateProject);
router.delete('/:id', protect, adminOnly, deleteProject);
router.post('/:id/members', protect, adminOnly, addMember);
router.delete('/:id/members/:userId', protect, adminOnly, removeMember);

module.exports = router;
