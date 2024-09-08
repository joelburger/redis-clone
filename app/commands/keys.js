const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { STORAGE } = require('../global');
const { constructArray } = require('../helpers/resp');

function filterKeys(map, specifiedKey) {
  if (specifiedKey) {
    return Array.from(map.keys()).filter((key) => key.toLowerCase() === specifiedKey.toLowerCase());
  }
  return Array.from(map.keys());
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.KEYS, args, 0, 1);
    const [specifiedKey] = args;
    const result = filterKeys(STORAGE, specifiedKey);
    socket.write(constructArray(result));
  },
};
