const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { STORAGE } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.GET, args, 1);
    const [specifiedKey] = args;

    console.log('STORAGE', Array.from(STORAGE.values()));

    if (STORAGE.has(specifiedKey)) {
      const matched = STORAGE.get(specifiedKey);
      writeString(connection, matched.value);
    } else {
      connection.write('$-1\r\n');
    }
  },
};
