const express = require('express');
const { protect, authorize } = require('../middleware/auth');
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

router.use(protect, authorize('Producer', 'ProductionTeam', 'Admin'));

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.post('/:id/roles', addRole);
router.post('/:id/roles/:roleId/casting', createCastingFromRole);
router.delete('/:id', deleteProject);

module.exports = router;
