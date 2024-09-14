const { commands } = require('../constants');
const { validateArguments, isReplica, isMaster } = require('../helpers/common');
const { constructSimpleString, constructBulkStringArray } = require('../helpers/resp');
const { REPLICA } = require('../global');

module.exports = {
  process(socket, args) {
    validateArguments(commands.REPLCONF, args, 2, 3);
    const [configProperty, configValue] = args;
    switch (configProperty.toLowerCase()) {
      case 'capa':
      case 'listening-port':
        socket.write(constructSimpleString('OK'));
        break;
      case 'ack':
        if (isMaster()) {
          REPLICA.ack++;
          console.log(`Incrementing replicas that sent ack. New ack count: ${REPLICA.ack}`);
        }
        break;
      case 'getack':
        if (isReplica()) {
          if (configValue === '*') {
            socket.write(constructBulkStringArray(['REPLCONF', 'ACK', String(REPLICA.bytesProcessed)]));
          } else {
            throw new Error('Invalid  argument for GETACK');
          }
        }
        break;
    }
  },
};
