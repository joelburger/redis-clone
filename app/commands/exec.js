const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { TRANSACTION } = require('../global');
const { constructError } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.EXEC, args, 0);

    if (!TRANSACTION.enabled) {
      socket.write(constructError('ERR EXEC without MULTI'));
      return;
    }

    TRANSACTION.queue.forEach(({ command, processor }) => {
      const [commandName, commandArgs] = command;

      console.log(`Processing queued command ${commandName}`);
      processor.process(socket, commandArgs);
    });
  },
};
