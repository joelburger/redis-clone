const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { STORAGE, REPLICA } = require('../global');
const { constructSimpleString, constructArray } = require('../helpers/resp');

module.exports = {
  createItem(key, value, expiryArgument, expiresIn) {
    const item = {
      name: key,
      value: isNaN(Number(value)) ? value : Number(value),
    };

    if (expiryArgument?.toLowerCase() === 'px') {
      item.expireAt = new Date(Date.now() + Number(expiresIn));
    }

    return item;
  },

  process(socket, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiresIn] = args;
    const item = this.createItem(key, value, expiryArgument, expiresIn);
    STORAGE.set(key, item);

    if (isMaster()) {
      REPLICA.clients.forEach((replicaSocket) => replicaSocket.write(constructArray(['SET', key, value])));
      socket.write(constructSimpleString('OK'));
    }
  },
};
