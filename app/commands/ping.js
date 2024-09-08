const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { constructSimpleString } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.PING, args, 0);
    socket.write(constructSimpleString('PONG'));
  },
};
