const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { TRANSACTION } = require('../global');
const { constructError, EMPTY_ARRAY } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.EXEC, args, 0);

    if (!TRANSACTION.enabled) {
      socket.write(constructError('ERR EXEC without MULTI'));
      return;
    }

    if (TRANSACTION.queue.length === 0) {
      socket.write(EMPTY_ARRAY);
      TRANSACTION.enabled = false;
      return;
    }

    TRANSACTION.queue.forEach(({ command, processor }) => {
      const [commandName, commandArgs] = command;

      console.log(`Processing queued command ${commandName}`);
      processor.process(socket, commandArgs);
    });

    TRANSACTION.enabled = false;
    TRANSACTION.queue = [];
  },
};
