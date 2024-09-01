const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');

module.exports = {
  process(connection, args) {
    validateArguments(commands.ECHO, args, 1);
    const [echoValue] = args;
    writeString(connection, echoValue);
  },
};
