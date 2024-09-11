const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { TRANSACTION } = require('../global');
const { constructError, EMPTY_ARRAY } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.EXEC, args, 0);

    const transaction = TRANSACTION.get(socket);

    if (!transaction.enabled) {
      socket.write(constructError('ERR EXEC without MULTI'));
      return;
    }

    if (transaction.queue.length === 0) {
      socket.write(EMPTY_ARRAY);
      transaction.enabled = false;
      return;
    }

    transaction.queue.forEach(({ commandName, args, processor }) => {
      console.log(`Processing queued command ${commandName} ${args}`);
      processor.process(socket, args);
    });

    transaction.enabled = false;
    transaction.queue = [];
  },
};
