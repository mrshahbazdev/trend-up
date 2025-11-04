const authRoutes = require('./routes/auth.routes');
const authMiddleware = require('./middleware/auth.middleware');
const authService = require('./services/auth.service');
const verificationService = require('./services/verification.service');
const emailService = require('./services/email.service');

module.exports = {
  authRoutes,
  authMiddleware,
  authService,
  verificationService,
  emailService,
};

