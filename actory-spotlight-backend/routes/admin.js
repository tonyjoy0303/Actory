const express = require('express');
const {
  getSwitchRequests,
  approveSwitchRequest,
  rejectSwitchRequest,
  getUsers,
  getProductionHouseRegistrations,
  approveProductionHouseRegistration,
  rejectProductionHouseRegistration,
  updateUser,
  deleteUser,
  getCastingCalls,
  updateCastingCall,
  deleteCastingCall,
  getVideos,
  updateVideo,
  deleteVideo
} = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes in this file are protected and for admins only
router.use(protect);
router.use(authorize('Admin'));

// Role Switch Request routes
router.route('/switch-requests').get(getSwitchRequests);
router.route('/switch-requests/:id/approve').put(approveSwitchRequest);
router.route('/switch-requests/:id/reject').put(rejectSwitchRequest);

// User management routes
router.route('/users').get(getUsers);
router.route('/users/:id').put(updateUser).delete(deleteUser);

// Production house registration review routes
router.route('/production-house-registrations').get(getProductionHouseRegistrations);
router.route('/production-house-registrations/:id/approve').put(approveProductionHouseRegistration);
router.route('/production-house-registrations/:id/reject').put(rejectProductionHouseRegistration);

// Casting call management routes
router.route('/castingcalls').get(getCastingCalls);
router.route('/castingcalls/:id').put(updateCastingCall).delete(deleteCastingCall);

// Video management routes
router.route('/videos').get(getVideos);
router.route('/videos/:id').put(updateVideo).delete(deleteVideo);

module.exports = router;