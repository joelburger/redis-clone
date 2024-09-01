const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { STORAGE } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.GET, args, 1);
    const [key] = args;
    if (STORAGE[key]) {
      if (STORAGE[key].expiresIn) {
        STORAGE[key].expireAt = new Date(Date.now() + STORAGE[key].expiresIn);
      }
      writeString(connection, STORAGE[key].value);
    } else {
      connection.write('$-1\r\n');
    }
  },
};
