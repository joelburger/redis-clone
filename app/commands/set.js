const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { STORAGE } = require('../global');
const { syncKeyWithReplicas, isMaster } = require('../replica');

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
  process(connection, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiresIn] = args;
    const item = createItem(key, value, expiryArgument, expiresIn);
    STORAGE.set(key, item);
    writeString(connection, 'OK');

    if (isMaster()) {
      syncKeyWithReplicas(key, value).then(() => console.log(`Synchronised ${key} with replicas`));
    }
  },
};
