const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { constructSimpleString, constructArray } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.PING, args, 0);
    if (isMaster()) {
      socket.write(constructSimpleString('PONG'));
    }
  },
};
