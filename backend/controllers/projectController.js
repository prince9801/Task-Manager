const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all projects (admin: all, member: own)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = Project.find();
    } else {
      query = Project.find({ members: req.user._id });
    }

    const projects = await query
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check access
    if (
      req.user.role !== 'admin' &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color, members } = req.body;

    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      owner: req.user._id,
      members: members || [],
    });

    await project.populate('owner', 'name email');
    await project.populate('members', 'name email role');

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete all tasks in project
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project and its tasks deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private/Admin
exports.addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already a member' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('owner', 'name email');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private/Admin
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('owner', 'name email');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};
