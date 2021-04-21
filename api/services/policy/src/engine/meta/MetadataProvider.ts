import { PostgresConnection } from '@ilos/connection-postgres';
import { provider } from '@ilos/common';

import { MetadataProviderInterface, MetadataProviderInterfaceResolver } from '../interfaces/MetadataProviderInterface';
import { MetadataWrapper } from './MetadataWrapper';
import { MetaInterface } from '../interfaces';

@provider({
  identifier: MetadataProviderInterfaceResolver,
})
export class MetadataProvider implements MetadataProviderInterface {
  public readonly table = 'policy.policy_metas';

  constructor(protected connection: PostgresConnection) {}

  async get(id: number, keys: string[] = []): Promise<MetaInterface> {
    const whereClauses: {
      text: string;
      value: any;
    }[] = [
      {
        text: 'policy_id = $1',
        value: id,
      },
    ];

    if (keys.length > 0) {
      whereClauses.push({
        text: 'key = ANY($2::varchar[])',
        value: keys,
      });
    }

    const query: {
      rowMode: string;
      text: string;
      values: any[];
    } = {
      rowMode: 'array',
      text: `
        SELECT
          key,
          (max(array[extract('epoch' from updated_at), value::int]))[2] as value
        FROM ${this.table}
        WHERE ${whereClauses.map((w) => w.text).join(' AND ')}
        GROUP BY key
      `,
      values: [...whereClauses.map((w) => w.value)],
    };

    const result = await this.connection.getClient().query(query);

    return new MetadataWrapper(id, result.rows);
  }

  async set(policyId: number, metadata: MetaInterface): Promise<void> {
    const keys = metadata.keys();
    const values = metadata.values();
    const policyIds = new Array(keys.length).fill(policyId);
    const query = {
      text: `
        INSERT INTO ${this.table} (policy_id, key, value)
          SELECT * FROM UNNEST($1::int[], $2::varchar[], $3::int[])
      `,
      values: [policyIds, keys, values],
    };

    await this.connection.getClient().query(query);
    return;
  }

  async wayback(policyId: number, from: Date): Promise<void> {
    const query = {
      text: `
        DELETE FROM ${this.table}
          WHERE policy_id = $1::int
          AND updated_at >= $2::timestamp
      `,
      values: [policyId, from],
    };

    await this.connection.getClient().query(query);
    return;
  }
}
