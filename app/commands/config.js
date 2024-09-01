const { commands } = require('../constants');
const { validateArguments, writeString, writeArray } = require('../utils');
const { CONFIG } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.CONFIG, args, 2);
    const [subCommand, key] = args;
    if (subCommand.toLowerCase() === 'get') {
      const configValue = CONFIG[key.toLowerCase()];
      writeArray(connection, [key, configValue]);
    } else {
      throw new Error(`Invalid subcommand: ${subCommand}`);
    }
  },
};
