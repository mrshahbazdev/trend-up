const votingRoutes = require('./routes/voting.routes');
const votingService = require('./services/voting.service');
const votingController = require('./controllers/voting.controller');

module.exports = {
  votingRoutes,
  votingService,
  votingController
};

