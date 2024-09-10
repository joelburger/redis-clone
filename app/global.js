module.exports = {
  STORAGE: new Map(),
  CONFIG: { serverInfo: {} },

  REPLICA: {
    /**
     * An array of client sockets. Each socket represents a connection to a replica server.
     */
    clients: [],

    /**
     * Refers to the number of bytes that have been processed by a replica
     * during replication. This is used to track the progress of data synchronisation
     * between the master and its replicas.
     *
     * When a replica connects to a master, it needs to synchronise its data
     * with the master. The `bytesProcessed` value helps in monitoring how
     * much data has been transferred and processed by the replica. This is
     * crucial for ensuring data consistency and for handling replication
     * acknowledgments (`ACK`) from replicas to the master.
     */
    bytesProcessed: 0,

    /**
     * Refers to the count of acknowledgments (ACKs) received from replicas.
     * This is used to track the number of replicas that have acknowledged receiving
     * data from the master. It helps in monitoring the replication process and
     * ensuring data consistency between the master and its replicas.
     */
    ack: 0,
  },
};
