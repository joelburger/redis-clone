const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { STORAGE } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiry] = args;

    let entry;
    if (expiryArgument?.toLowerCase() === 'px') {
      const expiresIn = Number(expiry);
      entry = {
        value,
        expireAt: new Date(Date.now() + expiresIn),
        expiresIn,
      };
    } else {
      entry = {
        value,
      };
    }
    STORAGE[key] = entry;
    writeString(connection, 'OK');
  },
};
