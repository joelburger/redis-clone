function validateArguments(commandName, args, minCount, maxCount = minCount) {
  if (minCount === 0) {
    return args.length === 0;
  }

  if (args.length < minCount || args.length > maxCount) {
    throw new Error(`Invalid number of arguments for ${commandName}`);
  }
}

function writeString(connection, stringValue) {
  connection.write(`+${stringValue}\r\n`);
}

function writeArray(connection, stringValues) {
  let output = `*${stringValues.length}\r\n`;
  for (const value of stringValues) {
    output += `$${value.length}\r\n${value}\r\n`;
  }
  console.log('output', output);
  connection.write(output);
}

function generateRandomString(length = 40) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

module.exports = {
  validateArguments,
  writeString,
  writeArray,
  generateRandomString,
};
