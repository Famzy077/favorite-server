const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
})();

module.exports = redisClient;
