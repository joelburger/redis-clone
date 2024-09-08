const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { constructSimpleString } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.ECHO, args, 1);
    const [echoValue] = args;
    socket.write(constructSimpleString(echoValue));
  },
};
