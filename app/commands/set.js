const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { STORAGE } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.SET, args, 2, 4);
    const [key, value, expiryArgument, expiresIn] = args;

    let item;
    if (expiryArgument?.toLowerCase() === 'px') {
      item = {
        name: key,
        value,
        expireAt: new Date(Date.now() + Number(expiresIn)),
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
