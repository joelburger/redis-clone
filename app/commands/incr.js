const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { STORAGE, REPLICAS, REPLICA_WAIT } = require('../global');
const { constructArray, constructSimpleNumber } = require('../helpers/resp');
const { createItem } = require('./set');

function propagateChanges() {
  REPLICAS.forEach((replicaSocket) => replicaSocket.write(constructArray(['INCR', specifiedKey])));
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.INCR, args, 1);
    const [specifiedKey] = args;

    if (!STORAGE.has(specifiedKey)) {
      console.log(`Specified key "${specifiedKey}" does not exist.`);

      STORAGE.set(specifiedKey, createItem(specifiedKey, 1));

      if (isMaster()) {
        propagateChanges();
        socket.write(constructSimpleNumber(1));
      }
      return;
    }

    const item = STORAGE.get(specifiedKey);

    if (typeof item.value !== 'number' || isNaN(item.value)) {
      console.log(`Specified key "${specifiedKey}" is not a number.`);
      return;
    }

    console.log(`Increment specified key "${specifiedKey}" by 1.`);
    item.value++;

    if (isMaster()) {
      propagateChanges();
      socket.write(constructSimpleNumber(item.value));
    }
  },
};
