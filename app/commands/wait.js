const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { constructSimpleInteger } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.WAIT, args, 2);
    if (isMaster()) {
      socket.write(constructSimpleInteger(0));
    }
  },
};
