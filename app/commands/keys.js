const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { STORAGE } = require('../global');
const { constructArray } = require('../helpers/resp');

function filterKeys(map, specifiedKey) {
  if (!specifiedKey) {
    throw new Error('Invalid argument for KEYS');
  }
  if (specifiedKey === '*') {
    return Array.from(map.keys());
  }
  return Array.from(map.keys()).filter((key) => key.toLowerCase() === specifiedKey.toLowerCase());
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.KEYS, args, 0, 1);
    const [specifiedKey] = args;
    const result = filterKeys(STORAGE, specifiedKey);
    socket.write(constructArray(result));
  },
};
