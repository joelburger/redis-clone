const net = require('net');

// References:
// https://nodejs.org/docs/latest-v20.x/api/net.html
// https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings

const commands = { PING: 'ping', ECHO: 'echo', SET: 'set', GET: 'get' };

function parseRespBulkString(data) {
  const dataString = Buffer.from(data).toString('UTF-8');

  return dataString.split('\r\n').filter((component) => {
    return component && !component.startsWith('*') && !component.startsWith('$');
  });
}

function validateArguments(commandName, arguments, expectedArgumentCount) {
  if (expectedArgumentCount === 0) {
    return !arguments;
  }

  if (arguments.length !== expectedArgumentCount) {
    throw new Error(`Invalid number of arguments for ${commandName}`);
  }
}

function writeString(connection, stringValue) {
  connection.write(`+${stringValue}\r\n`);
}

function handleData(connection, data, map) {
  const stringValues = parseRespBulkString(data);
  const [command, ...arguments] = stringValues;

  switch (command.toLowerCase()) {
    case commands.PING:
      validateArguments(commands.PING, arguments, 0);
      writeString(connection, 'PONG');
      break;
    case commands.ECHO:
      validateArguments(commands.ECHO, arguments, 1);
      const [echoValue] = arguments;
      writeString(connection, echoValue);
      break;
    case commands.SET:
      validateArguments(commands.SET, arguments, 2);
      const [key, value] = arguments;
      map[key] = value;
      writeString(connection, 'OK');
      break;
    case commands.GET:
      validateArguments(commands.GET, arguments, 1);
      const [searchKey] = arguments;
      if (map[searchKey]) {
        writeString(connection, map[searchKey]);
      } else {
        connection.write('$-1\\r\\n');
      }
      break;
    default:
      throw new Error(`Invalid command: ${command}`);
  }
}

const server = net.createServer((connection) => {
  const map = new Map();

  connection.on('data', (data) => {
    handleData(connection, data, map); // Send a response back to the client
  });
  connection.on('error', (err) => console.log('Connection error', err));
});

server.on('error', (err) => console.log('Server error', err));

server.listen(6379, '127.0.0.1', () => {
  console.log(`Listening on ${server.address().address}:${server.address().port}`);
});
