const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { constructSimpleString } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.MULTI, args, 0);
    if (isMaster()) {
      socket.write(constructSimpleString('OK'));
    }
  },
};
