const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { TRANSACTION } = require('../global');
const { constructError, EMPTY_ARRAY, constructBulkStringArray, removeTerminators } = require('../helpers/resp');

function createResponseAggregator() {
  const responses = [];

  return {
    write(value) {
      responses.push(value);
    },
    getBulkResponse() {
      return constructBulkStringArray(responses, false);
    },
  };
}

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

    const responseAggregator = createResponseAggregator();
    transaction.queue.forEach(({ commandName, args, processor }) => {
      console.log(`Processing queued command ${commandName} ${args}`);
      processor.process(responseAggregator, args);
    });

    socket.write(responseAggregator.getBulkResponse());

    transaction.enabled = false;
    transaction.queue = [];
  },
};
