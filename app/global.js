module.exports = {
  STORAGE: new Map(),
  CONFIG: { serverInfo: {} },
  REPLICAS: [],
  REPLICA_OFFSET: { bytesProcessed: 0 },
  REPLICA_WAIT: { ack: 0 },
};
