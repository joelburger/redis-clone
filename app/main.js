const net = require('net');

// References:
// https://nodejs.org/docs/latest-v20.x/api/net.html
// https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings

const commands = { PING: 'ping', ECHO: 'echo', SET: 'set', GET: 'get' };

const STORAGE = {};

function expireItems() {
  if (Object.keys(STORAGE).length === 0) {
    return;
  }
  Object.keys(STORAGE).forEach((key) => {
    const item = STORAGE[key];

    if (item.expiresIn) {
      if (new Date() > item.expireAt) {
        console.log(`Expiring ${key}`);
        delete STORAGE[key];
      }
    }
  });
}

setInterval(expireItems, 1);

function parseRespBulkString(data) {
  const dataString = Buffer.from(data).toString('UTF-8');

  return dataString.split('\r\n').filter((component) => {
    return component && !component.startsWith('*') && !component.startsWith('$');
  });
}

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

function handleData(connection, data) {
  const stringValues = parseRespBulkString(data);
  const [command, ...args] = stringValues;

  switch (command.toLowerCase()) {
    case commands.PING:
      validateArguments(commands.PING, args, 0);
      writeString(connection, 'PONG');
      break;
    case commands.ECHO:
      validateArguments(commands.ECHO, args, 1);
      const [echoValue] = args;
      writeString(connection, echoValue);
      break;
    case commands.SET:
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
      console.log('Adding entry', entry);
      STORAGE[key] = entry;
      writeString(connection, 'OK');
      break;
    case commands.GET:
      validateArguments(commands.GET, args, 1);
      const [searchKey] = args;
      if (STORAGE[searchKey]) {
        if (STORAGE[searchKey].expiresIn) {
          STORAGE[searchKey].expireAt = new Date(Date.now() + STORAGE[searchKey].expiresIn);
        }
        writeString(connection, STORAGE[searchKey].value);
      } else {
        connection.write('$-1\r\n');
      }
      break;
    default:
      throw new Error(`Invalid command: ${command}`);
  }
}

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    handleData(connection, data); // Send a response back to the client
  });
  connection.on('error', (err) => console.log('Connection error', err));
});

server.on('error', (err) => console.log('Server error', err));

server.listen(6379, '127.0.0.1', () => {
  console.log(`Listening on ${server.address().address}:${server.address().port}`);
});
