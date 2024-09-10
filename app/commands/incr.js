const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { STORAGE, REPLICAS, REPLICA_WAIT } = require('../global');
const { constructArray, constructSimpleNumber, constructError } = require('../helpers/resp');
const { createItem } = require('./set');

function propagateCommand(specifiedKey) {
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
        propagateCommand(specifiedKey);
        socket.write(constructSimpleNumber(1));
      }
      return;
    }

    const item = STORAGE.get(specifiedKey);

    if (!Number.isInteger(item.value)) {
      console.log(`Specified key "${specifiedKey}" is not a number.`);
      socket.write(constructError('ERR value is not an integer or out of range'));
      return;
    }

    console.log(`Increment specified key "${specifiedKey}" by 1.`);
    item.value++;

    if (isMaster()) {
      propagateCommand(specifiedKey);
      socket.write(constructSimpleNumber(item.value));
    }
  },
};
