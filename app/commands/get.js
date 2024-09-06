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
      if (matched.expiresIn) {
        matched.expireAt = new Date(Date.now() + matched.expiresIn);
      }
      writeString(connection, matched.value);
    } else {
      connection.write('$-1\r\n');
    }
  },
};
