const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { REPLICAS } = require('../global');
const network = require('../network');

function saveReplica(configProperty, configValue) {
  if (configProperty === 'listening-port') {
    console.log(`Adding replica on port: ${configValue}`);
  }
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2);
    const [configProperty, configValue] = args;
    saveReplica(configProperty, configValue);
    writeString(socket, 'OK');
  },
};
