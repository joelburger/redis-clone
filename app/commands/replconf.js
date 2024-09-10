const { commands } = require('../constants');
const { validateArguments, isReplica, isMaster } = require('../helpers/common');
const { constructSimpleString, constructArray } = require('../helpers/resp');
const { REPLICA_OFFSET, REPLICA_ACK, REPLICA_WAIT } = require('../global');

module.exports = {
  process(socket, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2, 3);
    const [configProperty, configValue] = args;
    switch (configProperty.toLowerCase()) {
      case 'capa':
      case 'listening-port':
        socket.write(constructSimpleString('OK'));
        break;
      case 'ack':
        if (isMaster()) {
          REPLICA_WAIT.ack++;
          console.log(`Incrementing replicas that sent ack. New ack count: ${REPLICA_WAIT.ack}`);
        }
        break;
      case 'getack':
        if (isReplica()) {
          if (configValue === '*') {
            socket.write(constructArray(['REPLCONF', 'ACK', String(REPLICA_OFFSET.bytesProcessed)]));
          } else {
            throw new Error('Invalid  argument for GETACK');
          }
        }
        break;
    }
  },
};
