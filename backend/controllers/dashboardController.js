const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    let taskFilter = {};

    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      taskFilter.$or = [
        { project: { $in: projectIds } },
        { assignedTo: req.user._id },
      ];
    }

    const [totalTasks, completedTasks, pendingTasks, overdueTasks, totalProjects, recentTasks] =
      await Promise.all([
        Task.countDocuments(taskFilter),
        Task.countDocuments({ ...taskFilter, status: 'completed' }),
        Task.countDocuments({ ...taskFilter, status: { $in: ['todo', 'in-progress', 'review'] } }),
        Task.countDocuments({
          ...taskFilter,
          dueDate: { $lt: now },
          status: { $ne: 'completed' },
        }),
        req.user.role === 'admin'
          ? Project.countDocuments()
          : Project.countDocuments({ members: req.user._id }),
        Task.find(taskFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('project', 'name color')
          .populate('assignedTo', 'name'),
      ]);

    let totalUsers = 0;
    if (req.user.role === 'admin') {
      totalUsers = await User.countDocuments();
    }

    // Task breakdown by status
    const statusBreakdown = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Tasks by priority
    const priorityBreakdown = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        totalProjects,
        totalUsers,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      statusBreakdown,
      priorityBreakdown,
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};
