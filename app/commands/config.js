const { commands } = require('../constants');
const { validateArguments, writeArray } = require('../utils');
const { CONFIG } = require('../global');

module.exports = {
  process(socket, args) {
    validateArguments(commands.CONFIG, args, 2);
    const [subCommand, key] = args;
    if (subCommand.toLowerCase() === 'get') {
      const configValue = CONFIG[key.toLowerCase()];
      writeArray(socket, [key, configValue]);
    } else {
      throw new Error(`Invalid subcommand: ${subCommand}`);
    }
  },
};
