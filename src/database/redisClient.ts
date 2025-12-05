import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || '', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redisClient.on('connect', () => {
  console.log('✅ Redis conectado com sucesso');
});

redisClient.on('error', (err) => {
  console.error('❌ Erro de conexão com Redis:', err);
});

export default redisClient;
