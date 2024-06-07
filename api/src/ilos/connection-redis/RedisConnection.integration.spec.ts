import { assertEquals, assert, assertFalse, assertThrows, assertObjectMatch, afterEach, beforeEach, afterAll, beforeAll, describe, it } from '@/dev_deps.ts';
import { RedisConnection } from './RedisConnection.ts';

interface Context {
  connection: RedisConnection;
}

const test = anyTest as TestFn<Context>;

beforeAll((t) => {
  t.context = {
    connection: new RedisConnection(process.env.APP_REDIS_URL ?? 'redis://127.0.0.1:6379'),
  };
});

afterAll(async (t) => {
  await t.context.connection.down();
});

it('Redis connection: works', async (t) => {
  t.plan(1);
  const client = t.context.connection.getClient();
  client.on('ready', () => {
    t.pass();
  });
  await t.context.connection.up();
  t.pass();
});
