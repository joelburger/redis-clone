const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { TRANSACTION } = require('../global');
const {
  constructError,
  EMPTY_ARRAY,
  constructArray,
  removeTerminators,
  constructSimpleString,
} = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.DISCARD, args, 0);

    const transaction = TRANSACTION.get(socket);

    if (!transaction.enabled) {
      socket.write(constructError('ERR DISCARD without MULTI'));
      return;
    }

    socket.write(constructSimpleString('OK'));

    transaction.enabled = false;
    transaction.queue = [];
  },
};
