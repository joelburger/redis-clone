const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { REPLICAS } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2);
    const [property, value] = args;

    // TODO Complete this
    if (property === 'listening-port') {
      console.log(`Adding replica port: ${value}`);
    }
    writeString(connection, 'OK');
  },
};
