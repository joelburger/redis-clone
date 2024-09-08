const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');

module.exports = {
  process(socket, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2);
    const [configProperty, configValue] = args;
    if (configProperty === 'listening-port') {
      console.log(`Adding replica on port: ${configValue}`);
      //TODO
    }
    writeString(socket, 'OK');
  },
};
