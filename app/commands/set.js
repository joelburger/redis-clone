const { commands } = require('../constants');
const { validateArguments, isMaster, isNumber, createItem } = require('../helpers/common');
const { STORAGE, REPLICA } = require('../global');
const { constructSimpleString, constructArray } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiresIn] = args;
    const item = createItem(key, value, 'string', expiryArgument, expiresIn);
    STORAGE.set(key, item);

    if (isMaster()) {
      REPLICA.clients.forEach((replicaSocket) => replicaSocket.write(constructArray(['SET', key, value])));
      socket.write(constructSimpleString('OK'));
    }
  },
};
