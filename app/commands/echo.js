const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');

module.exports = {
  process(socket, args) {
    validateArguments(commands.ECHO, args, 1);
    const [echoValue] = args;
    writeString(socket, echoValue);
  },
};
