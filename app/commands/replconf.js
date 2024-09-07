const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { REPLICAS } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2);
    const [property, value] = args;
    if (property === 'listening-port') {
      console.log(`Adding replica port: ${value}`);
      REPLICAS.push(value);
    }
    writeString(connection, 'OK');
  },
};
