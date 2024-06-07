import { assertEquals, assert, assertFalse, assertThrows, assertObjectMatch, afterEach, beforeEach, afterAll, beforeAll, describe, it } from '@/dev_deps.ts';
import { assertEquals, assert, assertFalse, assertThrows, assertObjectMatch, afterEach, beforeEach, afterAll, beforeAll, describe, it } from '@/dev_deps.ts';
import { makeDbBeforeAfter, DbContext } from '@/pdc/providers/test/index.ts';
import { insertableCarpool, updatableCarpool } from '../mocks/database/carpool.ts';
import { CarpoolAcquisitionService } from './CarpoolAcquisitionService.ts';
import { assertEquals, assert, assertFalse, assertThrows, assertObjectMatch, afterEach, beforeEach, afterAll, beforeAll, describe, it } from '@/dev_deps.ts';
import { CarpoolStatusRepository } from '../repositories/CarpoolStatusRepository.ts';
import { CarpoolRequestRepository } from '../repositories/CarpoolRequestRepository.ts';
import { CarpoolLookupRepository } from '../repositories/CarpoolLookupRepository.ts';
import { CarpoolRepository } from '../repositories/CarpoolRepository.ts';
import sql, { raw } from '../helpers/sql.ts';
import { CarpoolGeoRepository } from '../repositories/CarpoolGeoRepository.ts';
import { GeoProvider } from '@/pdc/providers/geo/index.ts';

interface TestContext {
  carpoolRepository: CarpoolRepository;
  statusRepository: CarpoolStatusRepository;
  requestRepository: CarpoolRequestRepository;
  lookupRepository: CarpoolLookupRepository;
  geoRepository: CarpoolGeoRepository;
  geoService: GeoProvider;
  db: DbContext;
  sinon: SinonSandbox;
}

const test = anyTest as TestFn<TestContext>;
const { before, after } = makeDbBeforeAfter();

beforeAll(async (t) => {
  const db = await before();
  const geoStub = sinon.createStubInstance(GeoProvider);

  t.context.db = db;
  t.context.carpoolRepository = new CarpoolRepository(db.connection);
  t.context.statusRepository = new CarpoolStatusRepository(db.connection);
  t.context.requestRepository = new CarpoolRequestRepository(db.connection);
  t.context.lookupRepository = new CarpoolLookupRepository(db.connection);
  t.context.geoRepository = new CarpoolGeoRepository(db.connection);
  t.context.geoService = geoStub;
});

function getService(context: TestContext, overrides: any): CarpoolAcquisitionService {
  return new CarpoolAcquisitionService(
    context.db.connection,
    overrides.statusRepository ?? context.statusRepository,
    overrides.requestRepository ?? context.requestRepository,
    overrides.lookupRepository ?? context.lookupRepository,
    overrides.carpoolRepository ?? context.carpoolRepository,
    overrides.geoRepository ?? context.geoRepository,
    context.geoService,
  );
}

test.after.always(async (t) => {
  await after(t.context.db);
});

beforeEach((t) => {
  t.context.sinon = Sinon.createSandbox();
});

test.afterEach.always((t) => {
  t.context.sinon.restore();
});

it('Should create carpool', async (t) => {
  const carpoolRepository = t.context.sinon.spy(t.context.carpoolRepository);
  const requestRepository = t.context.sinon.spy(t.context.requestRepository);
  const statusRepository = t.context.sinon.spy(t.context.statusRepository);

  const service = getService(t.context, {
    carpoolRepository,
    requestRepository,
    statusRepository,
  });

  const data = { ...insertableCarpool };
  await service.registerRequest({ ...data, api_version: 3 });

  // t.log(carpoolRepository.register.getCalls());
  assert(carpoolRepository.register.calledOnce);
  // t.log(requestRepository.save.getCalls());
  assert(requestRepository.save.calledOnce);
  // t.log(statusRepository.saveAcquisitionStatus.getCalls());
  assert(statusRepository.saveAcquisitionStatus.calledOnce);

  const { _id, uuid, created_at, updated_at, ...carpool } = await t.context.lookupRepository.findOne(
    data.operator_id,
    data.operator_journey_id,
  );
  assertObjectMatch(carpool, {
    ...data,
    fraud_status: 'pending',
    acquisition_status: 'received',
  });
});

it('Should update carpool', async (t) => {
  const carpoolRepository = t.context.sinon.spy(t.context.carpoolRepository);
  const requestRepository = t.context.sinon.spy(t.context.requestRepository);
  const statusRepository = t.context.sinon.spy(t.context.statusRepository);

  const service = getService(t.context, {
    carpoolRepository,
    requestRepository,
    statusRepository,
  });

  const data = { ...updatableCarpool };
  await service.updateRequest({
    ...data,
    api_version: 3,
    operator_id: insertableCarpool.operator_id,
    operator_journey_id: insertableCarpool.operator_journey_id,
  });

  // t.log(carpoolRepository.update.getCalls());
  assert(carpoolRepository.update.calledOnce);
  // t.log(requestRepository.save.getCalls());
  assert(requestRepository.save.calledOnce);
  // t.log(statusRepository.saveAcquisitionStatus.getCalls());
  assert(statusRepository.saveAcquisitionStatus.calledOnce);

  const { _id, uuid, created_at, updated_at, ...carpool } = await t.context.lookupRepository.findOne(
    insertableCarpool.operator_id,
    insertableCarpool.operator_journey_id,
  );
  assertObjectMatch(carpool, {
    ...insertableCarpool,
    ...updatableCarpool,
    fraud_status: 'pending',
    acquisition_status: 'updated',
  });
});

it('Should cancel carpool', async (t) => {
  const lookupRepository = t.context.sinon.spy(t.context.lookupRepository);
  const requestRepository = t.context.sinon.spy(t.context.requestRepository);
  const statusRepository = t.context.sinon.spy(t.context.statusRepository);

  const service = getService(t.context, {
    lookupRepository,
    requestRepository,
    statusRepository,
  });

  const data = {
    cancel_code: 'FRAUD',
    cancel_message: 'Got u',
    api_version: 3,
    operator_id: insertableCarpool.operator_id,
    operator_journey_id: insertableCarpool.operator_journey_id,
  };
  await service.cancelRequest(data);

  // t.log(lookupRepository.findOneStatus.getCalls());
  assert(lookupRepository.findOneStatus.calledOnce);
  // t.log(requestRepository.save.getCalls());
  assert(requestRepository.save.calledOnce);
  // t.log(statusRepository.saveAcquisitionStatus.getCalls());
  assert(statusRepository.saveAcquisitionStatus.calledOnce);

  const { _id, uuid, created_at, updated_at, ...carpool } = await t.context.lookupRepository.findOne(
    insertableCarpool.operator_id,
    insertableCarpool.operator_journey_id,
  );
  assertObjectMatch(carpool, {
    ...insertableCarpool,
    ...updatableCarpool,
    fraud_status: 'pending',
    acquisition_status: 'canceled',
  });
});

it('Should rollback if something fail', async (t) => {
  const carpoolRepository = t.context.sinon.spy(t.context.carpoolRepository);
  const requestRepository = t.context.sinon.spy(t.context.requestRepository);
  t.context.sinon.replace(
    t.context.statusRepository,
    'saveAcquisitionStatus',
    t.context.sinon.fake.throws(new Error('DB')),
  );

  const service = getService(t.context, {
    carpoolRepository,
    requestRepository,
  });

  const data = { ...insertableCarpool, operator_journey_id: 'operator_journey_id_2' };
  await assertThrows(async () => await service.registerRequest({ ...data, api_version: 3 }));

  assert(carpoolRepository.register.calledOnce);
  assert(requestRepository.save.calledOnce);

  const result = await t.context.db.connection
    .getClient()
    .query(
      sql`SELECT * FROM ${raw(t.context.carpoolRepository.table)} WHERE operator_id = ${
        data.operator_id
      } AND operator_journey_id = ${data.operator_journey_id}`,
    );
  assertObjectMatch(result.rows, []);
});
