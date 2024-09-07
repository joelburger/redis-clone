const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');

module.exports = {
  process(connection, args) {
    validateArguments(commands.REPLICA_CONFIG, args, 2);
    [property, value] = args;
    // TODO save replica config
    console.log('property', property);
    console.log('value', value);
    writeString(connection, 'OK');
  },
};
