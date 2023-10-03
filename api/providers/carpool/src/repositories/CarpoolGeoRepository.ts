import { provider } from '@ilos/common';
import { PoolClient, PostgresConnection } from '@ilos/connection-postgres';
import { UpsertableCarpoolGeo } from '../interfaces';

@provider()
export class CarpoolGeoRepository {
  constructor(protected connection: PostgresConnection) {}

  public async upsert(data: UpsertableCarpoolGeo, client?: PoolClient): Promise<void> {}
}