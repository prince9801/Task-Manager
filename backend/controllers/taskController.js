const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignedTo, search, overdue } = req.query;

    let filter = {};

    // Members can only see tasks from their projects or assigned to them
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      filter.$or = [
        { project: { $in: projectIds } },
        { assignedTo: req.user._id },
      ];
    }

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'completed' };
    }

    const tasks = await Task.find(filter)
      .populate('project', 'name color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name color members')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, project, assignedTo, tags } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      tags: tags || [],
    });

    await task.populate('project', 'name color');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Admin: all fields, Member: only status if assigned)
exports.updateTask = async (req, res, next) => {
  try {
    const task = req.task || await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Members can only update status
    let updateData = req.body;
    if (req.user.role === 'member') {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Members can only update task status' });
      }
      updateData = { status };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('project', 'name color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, task: updatedTask });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};
