const { commands } = require('../constants');
const { validateArguments, writeString, writeArray, isMaster } = require('../utils');
const { STORAGE, REPLICAS } = require('../global');

function createItem(key, value, expiryArgument, expiresIn) {
  if (expiryArgument?.toLowerCase() === 'px') {
    return {
      name: key,
      value,
      expireAt: new Date(Date.now() + Number(expiresIn)),
    };
  }
  return {
    value,
  };
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiresIn] = args;
    const item = createItem(key, value, expiryArgument, expiresIn);
    STORAGE.set(key, item);
    writeString(socket, 'OK');

    if (isMaster()) {
      REPLICAS.forEach((replicaSocket) => writeArray(replicaSocket, ['SET', key, value]));
    }
  },
};
