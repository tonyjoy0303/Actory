const express = require('express');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  addRole,
  createCastingFromRole,
  deleteProject
} = require('../controllers/projects');

const router = express.Router();

// Project creation and management (restricted)
router.post('/', protect, authorize('Producer', 'ProductionTeam', 'Admin'), createProject);
router.get('/', protect, authorize('Producer', 'ProductionTeam', 'Admin'), getProjects);
router.put('/:id', protect, authorize('Producer', 'ProductionTeam', 'Admin'), updateProject);
router.post('/:id/roles', protect, authorize('Producer', 'ProductionTeam', 'Admin'), addRole);
router.post('/:id/roles/:roleId/casting', protect, authorize('Producer', 'ProductionTeam', 'Admin'), createCastingFromRole);
router.delete('/:id', protect, authorize('Producer', 'ProductionTeam', 'Admin'), deleteProject);

// Public/actor-friendly project view (read-only)
router.get('/:id', optionalAuth, getProjectById);

module.exports = router;
