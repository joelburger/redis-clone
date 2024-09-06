const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { STORAGE } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiry] = args;

    let item;
    if (expiryArgument?.toLowerCase() === 'px') {
      const expiresIn = Number(expiry);
      item = {
        name: key,
        value,
        expireAt: new Date(Date.now() + expiresIn),
        expiresIn,
      };
    } else {
      item = {
        value,
      };
    }
    STORAGE.set(key, item);
    writeString(connection, 'OK');
  },
};
