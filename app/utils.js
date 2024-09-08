const { CONFIG } = require('./global');
const NULL_VALUE = '$-1\r\n';

function validateArguments(commandName, args, minCount, maxCount = minCount) {
  if (minCount === 0) {
    return args.length === 0;
  }

  if (args.length < minCount || args.length > maxCount) {
    throw new Error(`Invalid number of arguments for ${commandName}`);
  }
}

function constructArray(stringValues) {
  let output = `*${stringValues.length}\r\n`;
  for (const value of stringValues) {
    output += `$${value.length}\r\n${value}\r\n`;
  }
  return output;
}

function constructSimpleString(stringValue) {
  return `+${stringValue}\r\n`;
}

function writeString(socket, stringValue) {
  socket.write(constructSimpleString(stringValue));
}

function writeArray(socket, stringValues) {
  socket.write(constructArray(stringValues));
}

async function writeArrayAsync(socket, stringValues) {
  return new Promise((resolve, reject) => {
    const payload = constructArray(stringValues);
    socket.write(payload, (err) => {
      if (err) {
        return reject(err);
      }
    });

    socket.once('data', (buffer) => {
      try {
        const { stringValue } = parseString(buffer);
        resolve(cleanString(stringValue));
      } catch (err) {
        console.log('Error:', err);
        reject(err);
      }
    });

    socket.once('error', (err) => {
      console.log('Error:', err);
      reject(err);
    });
  });
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

function parseArrayBulkString(data) {
  const regex = /\*(\d+)\r\n(\$\d+\r\n.+\r\n)+/g;
  const matches = data.match(regex) || [];
  return matches.map((match) =>
    match.split('\r\n').filter((component) => component && !component.startsWith('*') && !component.startsWith('$')),
  );
}

function sliceData(buffer, startCharacter, endCharacter) {
  const startPosition = buffer.findIndex((byte) => byte === startCharacter);
  const endPosition = buffer.findIndex((byte) => byte === endCharacter);

  if (startPosition > -1 && endPosition > startPosition) {
    return buffer.slice(startPosition + 1, endPosition);
  }
  return buffer;
}

function cleanString(stringValue, subChar = '') {
  if (!stringValue) {
    return '';
  }
  return stringValue.replace(/[\r\n]/g, subChar);
}

function parseNumber(buffer, cursor, numberOfBytes) {
  let unixTime = 0;
  for (let i = 0; i < numberOfBytes; i++) {
    unixTime += buffer[cursor + i] * Math.pow(256, i);
  }

  return unixTime;
}

function parseString(buffer, cursor = 0) {
  if (cursor >= buffer.length) {
    return [null, 0];
  }

  // first character indicates the length of the key
  const stringLength = buffer[cursor];

  // increment cursor to the start of the string value
  cursor++;

  // retrieve the string value
  const stringValue = buffer.slice(cursor, cursor + stringLength)?.toString('ascii');

  // increment cursor with length of string
  cursor += stringLength;

  return { stringValue, cursor };
}

function isMaster() {
  return CONFIG.serverInfo.role === 'master';
}

function isReplica() {
  return CONFIG.serverInfo.role === 'slave';
}

module.exports = {
  validateArguments,
  writeString,
  writeArray,
  writeArrayAsync,
  generateRandomString,
  parseArrayBulkString,
  sliceData,
  parseNumber,
  parseString,
  isMaster,
  isReplica,
  NULL_VALUE,
};
