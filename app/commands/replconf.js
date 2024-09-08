const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { constructSimpleString } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2);
    const [configProperty, configValue] = args;
    if (configProperty === 'listening-port') {
      console.log(`Adding replica on port: ${configValue}`);
      //TODO
    }
    socket.write(constructSimpleString('OK'));
  },
};
