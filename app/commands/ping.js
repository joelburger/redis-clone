const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');

module.exports = {
  process(connection, args) {
    validateArguments(commands.PING, args, 0);
    writeString(connection, 'PONG');
  },
};
