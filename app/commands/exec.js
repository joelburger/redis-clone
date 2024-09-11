const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { TRANSACTION } = require('../global');
const { constructError, EMPTY_ARRAY, constructArray, removeTerminators } = require('../helpers/resp');

function createResponseAggregator() {
  const responses = [];

  return {
    write(value) {
      responses.push(value);
    },
    getBulkResponse() {
      return responses.reduce((acc, response) => {
        return (acc += response);
      }, `*${responses.length}\r\n`);
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
