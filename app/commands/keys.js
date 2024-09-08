const { commands } = require('../constants');
const { validateArguments, writeArray } = require('../utils');
const { STORAGE } = require('../global');

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
    const output = filterKeys(STORAGE, specifiedKey);

    writeArray(socket, Array.from(output));
  },
};
