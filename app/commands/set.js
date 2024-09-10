const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { STORAGE, REPLICAS } = require('../global');
const { constructSimpleString, constructArray } = require('../helpers/resp');

function createItem(key, value, expiryArgument, expiresIn) {
  const item = {
    name: key,
    value: isNaN(Number(value)) ? value : Number(value),
  };

  if (expiryArgument?.toLowerCase() === 'px') {
    item.expireAt = new Date(Date.now() + Number(expiresIn));
  }

  return item;
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiresIn] = args;
    const item = createItem(key, value, expiryArgument, expiresIn);
    STORAGE.set(key, item);

    if (isMaster()) {
      REPLICAS.forEach((replicaSocket) => replicaSocket.write(constructArray(['SET', key, value])));
      socket.write(constructSimpleString('OK'));
    }
  },
};
