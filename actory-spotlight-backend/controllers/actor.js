const RoleSwitchRequest = require('../models/RoleSwitchRequest');

// @desc    Request to switch role to Producer
// @route   POST /api/v1/actor/request-switch
// @access  Private (Actor)
exports.requestSwitch = async (req, res, next) => {
    try {
        const { reason } = req.body;

        // Check if a pending request already exists for this user
        const existingRequest = await RoleSwitchRequest.findOne({ actorId: req.user.id, status: 'Pending' });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'You already have a pending request.' });
        }

        const request = await RoleSwitchRequest.create({
            actorId: req.user.id,
            reason
        });

        res.status(201).json({ success: true, data: request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
