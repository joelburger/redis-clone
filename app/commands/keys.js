const { commands, parameters, fileMarkers } = require('../constants');
const { validateArguments, writeString, writeArray } = require('../utils');
const { STORAGE } = require('../global');

function filterKeys(map, specifiedKey) {
  if (specifiedKey) {
    return Array.from(map.keys()).filter((key) => key.toLowerCase() === specifiedKey.toLowerCase());
  }
  return Array.from(map.keys());
}

module.exports = {
  process(connection, args) {
    validateArguments(commands.KEYS, args, 0, 1);

    const [specifiedKey] = args;
    const output = filterKeys(STORAGE, specifiedKey);

    writeArray(connection, Array.from(output));
  },
};
