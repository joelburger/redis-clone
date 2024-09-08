const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');

module.exports = {
  process(socket, args) {
    validateArguments(commands.PING, args, 0);
    writeString(socket, 'PONG');
  },
};
