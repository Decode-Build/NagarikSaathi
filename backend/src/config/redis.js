const Redis = require('ioredis');
const { env } = require('./env');

const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.error('Redis error', err);
});

module.exports = { redisConnection };
