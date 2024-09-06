const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');

module.exports = {
  process(connection, args) {
    validateArguments(commands.INFO, args, 0, 1);

    // TODO replace this
    const serverInfo = 'role:master';

    writeString(connection, serverInfo);
  },
};
