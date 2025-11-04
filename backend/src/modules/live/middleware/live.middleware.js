const Space = require('../models/stream.model'); // Adjust path if needed
const { AuthorizationError, NotFoundError } = require('../../../core/errors/AppError'); // Assuming AppError is in core
const ErrorHandler = require('../../../core/errors/ErrorHandler');

/**
 * Middleware to check if the authenticated user is the owner of the space.
 * Assumes that the authentication middleware (req.user) has already run.
 */
const isSpaceOwner = ErrorHandler.handleAsync(async (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user || !req.user._id) { // Use _id or your user identifier field
        throw new AuthorizationError('User not authenticated');
    }

    // Get channelName from request (can be in params or body)
    const channelName = req.params.channelName || req.body.channelName;
    if (!channelName) {
        throw new AuthorizationError('Channel name is required for ownership check.');
    }

    // Find the space
    const space = await Space.findOne({ channelName: channelName, isLive: true }).select('ownerUid'); // Select only ownerUid for efficiency
    if (!space) {
        throw new NotFoundError('Live space not found.');
    }

    // Check ownership
    // Convert both to string for comparison to avoid ObjectId issues
    const ownerUidAsString = space.ownerUid.toString();
    const userIdAsString = req.user._id.toString(); 

    if (ownerUidAsString !== userIdAsString) {
        throw new AuthorizationError('Access denied. Only the space owner can perform this action.');
    }

    // If owner, proceed to the next middleware or controller
    next();
});

module.exports = {
    isSpaceOwner,
};
