const net = require('net');

// refer to https://nodejs.org/docs/latest-v20.x/api/net.html

function parseRespBulkString(data) {
  const dataString = Buffer.from(data).toString('UTF-8');

  return dataString.split('\r\n').filter((component) => {
    return component && !component.startsWith('*') && !component.startsWith('$');
  });
}

function handleData(connection, data) {
  const stringValues = parseRespBulkString(data);
  if (stringValues.length === 2 && stringValues[0].toLowerCase() === 'echo') {
    connection.write(`+${stringValues[1]}\r\n`);
  } else if (stringValues.length === 1 && stringValues[0].toLowerCase() === 'ping') {
    connection.write('+PONG\r\n');
  } else {
    throw new Error('Invalid data');
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
