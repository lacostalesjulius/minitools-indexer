// models/aggregator.js

/**
 * @typedef {Object} ServiceInfo
 * @property {string} id - Unique service ID
 * @property {string} name - Service display name
 * @property {'Online'|'Offline'} status - Service status
 * @property {boolean} healthy - Health boolean
 * @property {string} ip - IP address
 * @property {string} port - Port
 * @property {string} endpoint - Ping endpoint URL
 * @property {number|null} responseTime - Response time in ms, null if offline
 * @property {number} lastChanged - Timestamp of last change
 * @property {Object} meta - Extra metadata
 */

/**
 * @typedef {Object} AggregatorSnapshot
 * @property {number} version - Snapshot version
 * @property {number} generatedAt - Timestamp when snapshot was generated
 * @property {number} interval - Interval of snapshot updates
 * @property {ServiceInfo[]} services - Array of service info objects
 */

/**
 * Generate an empty AggregatorSnapshot
 * @param {number} [interval=5000] - Interval of snapshot updates in ms
 * @returns {AggregatorSnapshot}
 */
export function createEmptySnapshot(interval = 5000) {
  return {
    version: 1,
    generatedAt: Date.now(),
    interval,
    services: []
  };
}

/**
 * Generate a new ServiceInfo
 * @param {string} ip
 * @param {string} port
 * @param {string} [name]
 * @returns {ServiceInfo}
 */
export function createService(ip, port, name) {
  const displayName = name ?? `${ip}:${port}`;
  return {
    id: `service:${displayName}`,
    name: displayName,
    status: 'offline',
    healthy: false,
    ip,
    port,
    endpoint: `http://${ip}:${port}/ping`,
    responseTime: null,
    lastChanged: Date.now(),
    meta: {}
  };
}
