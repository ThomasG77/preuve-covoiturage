import anyTest, { TestFn } from 'ava';
import { PostgresConnection } from '/ilos/connection-postgres/index.ts';

import { CrosscheckRepositoryProvider } from './CrosscheckRepositoryProvider.ts';

interface TestContext {
  connection: PostgresConnection;
  repository: CrosscheckRepositoryProvider;
}

const test = anyTest as TestFn<TestContext>;

test.before.skip(async (t) => {
  t.context.connection = new PostgresConnection({
    connectionString:
      'APP_POSTGRES_URL' in process.env
        ? process.env.APP_POSTGRES_URL
        : 'postgresql://postgres:postgres@localhost:5432/local',
  });
  await t.context.connection.up();
  t.context.repository = new CrosscheckRepositoryProvider(t.context.connection);
});

test.after.always(async (t) => {
  await t.context.connection.down();
});

test.serial.skip('Should get a new uuid', async (t) => {
  const data = {
    operator_trip_id: '0',
    datetime: new Date(),
    start: {
      lat: 0,
      lon: 0,
      territory_id: 0,
      geo_code: '',
    },
    end: {
      lat: 0,
      lon: 0,
      territory_id: 0,
      geo_code: '',
    },
    identity_uuid: '973b462f-6521-4b57-85c8-970c2d34fb10',
  };
  const uuid = await t.context.repository.getTripId(data);
  t.is(typeof uuid, 'string');

  const uuid2 = await t.context.repository.getTripId(data);
  t.is(typeof uuid2, 'string');
  t.not(uuid, uuid2);
});
