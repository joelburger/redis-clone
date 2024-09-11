const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { constructSimpleString } = require('../helpers/resp');
const { TRANSACTION } = require('../global');

module.exports = {
  process(socket, args) {
    validateArguments(commands.MULTI, args, 0);

    TRANSACTION.enabled = true;

    if (isMaster()) {
      socket.write(constructSimpleString('OK'));
    }
  },
};
