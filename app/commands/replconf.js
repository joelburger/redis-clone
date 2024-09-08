const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { constructSimpleString, constructArray } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2, 3);
    const [configProperty, configValue] = args;
    switch (configProperty.toLowerCase()) {
      case 'capa':
      case 'listening-port':
        console.log(`Adding replica on port: ${configValue}`);
        socket.write(constructSimpleString('OK'));
        break;
      case 'getack':
        if (configValue === '*') {
          socket.write(constructArray(['REPLCONF', 'ACK', '0']));
        } else {
          throw new Error('Invalid  argument for GETACK');
        }
    }
  },
};
