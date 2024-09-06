const { commands, parameters } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { CONFIG } = require('../global');

function calculateRole() {
  if (CONFIG[parameters.REPLICA_OF]) {
    return 'slave';
  }
  return 'master';
}

module.exports = {
  process(connection, args) {
    validateArguments(commands.INFO, args, 0, 1);

    // TODO replace this

    const serverInfo = `role:${calculateRole()}`;

    writeString(connection, serverInfo);
  },
};
