const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { STORAGE, REPLICAS, REPLICA_WAIT } = require('../global');
const { constructArray, constructSimpleNumber } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.INCR, args, 1);
    const [specifiedKey] = args;

    if (!STORAGE.has(specifiedKey)) {
      console.log(`Specified key "${specifiedKey}" does not exist.`);
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
      REPLICAS.forEach((replicaSocket) => replicaSocket.write(constructArray(['INCR', specifiedKey])));
      socket.write(constructSimpleNumber(item.value));
    }
  },
};
