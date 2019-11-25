import { provider } from '@ilos/common';
import { PostgresConnection } from '@ilos/connection-postgres';

import {
  TripSearchInterfaceWithPagination,
  TripSearchInterface,
} from '../shared/trip/common/interfaces/TripSearchInterface';
import {
  LightTripInterface,
  TripRepositoryInterface,
  TripRepositoryProviderInterfaceResolver,
} from '../interfaces';

import { ResultWithPagination } from '../shared/common/interfaces/ResultWithPagination';

/*
 * Trip specific repository
 */
@provider({
  identifier: TripRepositoryProviderInterfaceResolver,
})
export class TripRepositoryProvider implements TripRepositoryInterface {
  public readonly table = 'carpool.carpools';
  public readonly identityTable = 'carpool.identities';

  constructor(public connection: PostgresConnection) {}

  protected buildWhereClauses(
    filters: Partial<TripSearchInterface>,
  ): {
    text: string;
    values: any[];
  } {
    const filtersToProcess = [
      'territory_id',
      'operator_id',
      // 'status',
      'date',
      'ranks',
      'distance',
      'towns',
      // 'campaign_id',
      'days',
      'hour',
    ].filter((key) => key in filters);

    let orderedFilters = {
      text: [],
      values: [],
    };

    if (filtersToProcess.length > 0) {
      orderedFilters = filtersToProcess
        .map((key) => ({ key, value: filters[key] }))
        .map((filter) => {
          switch (filter.key) {
            case 'territory_id':
              return {
                text: '(start_territory = ANY ($#::text[]) OR end_territory = ANY ($#::text[]))',
                values: [filter.value, filter.value],
              };
            case 'operator_id':
              return {
                text: 'operator_id = ANY ($#::text[])',
                values: [filter.value],
              };
            case 'status':
              throw new Error('Unimplemented');
            case 'date':
              return {
                text: '(datetime BETWEEN $#::timestamp AND $#::timestamp)',
                values: [
                  filter.value.start,
                  filter.value.end,
                ],
              };
            case 'ranks':
              return {
                text: 'operator_class = ANY ($#::text[])',
                values: [filter.value],
              };
            case 'distance':
              if (filter.value.min && filter.value.max) {
                return {
                  text: '($#::int <= distance AND distance <= $#::int)',
                  values: [filter.value.min, filter.value.max],
                };
              }
              if (filter.value.min) {
                return {
                  text: '$#::int <= distance',
                  values: [filter.value.min],
                };
              }
              return {
                text: 'distance <= $#::int',
                values: [filter.value.max],
              };
            case 'campaign_id':
              throw new Error('Unimplemented');
            case 'towns':
              const towns = filter.value.map((v: string) => `%${v}%`);
              return {
                text: 'start_town LIKE ANY($#::text[]) OR end_town LIKE ANY ($#::text[])',
                values: [towns, towns],
              };
            case 'days':
              return {
                text: 'extract(isodow from datetime) = ANY ($#::int[])',
                values: [filter.value],
              };
            case 'hour': {
              return {
                text: '($#::int <= extract(hour from datetime) AND extract(hour from datetime) <= $#::int)',
                values: [filter.value.start, filter.value.end],
              };
            }
          }
        })
        .reduce(
          (acc, current) => {
            acc.text.push(current.text);
            acc.values.push(...current.values);
            return acc;
          },
          {
            text: [],
            values: [],
          },
        );
    }

    orderedFilters.text.push('is_driver = false');

    const whereClauses = `WHERE ${orderedFilters.text.join(' AND ')}`;
    const whereClausesValues = orderedFilters.values;

    return {
      text: whereClauses,
      values: whereClausesValues,
    };
  }

  public async stats(params: Partial<TripSearchInterfaceWithPagination>): Promise<any> {
    const where = this.buildWhereClauses(params);

    const query = {
      text: `
      SELECT
        datetime::date as day,
        sum(distance*seats)::int as distance,
        sum(seats+1)::int as carpoolers,
        count(*)::int as trip,
        '0'::int as trip_subsidized,
        count(distinct operator_id)::int as operators
      FROM ${this.table}
      ${where ? where.text : ''}
      GROUP BY day
      ORDER BY day ASC`,
      values: [
        // casting to int ?
        ...(where ? where.values : []),
      ],
      // count(*) FILTER (WHERE array_length(incentives, 1) > 0)
    };

    query.text = query.text.split('$#').reduce((acc, current, idx, origin) => {
      if (idx === origin.length - 1) {
        return `${acc}${current}`;
      }

      return `${acc}${current}$${idx + 1}`;
    }, '');

    const result = await this.connection.getClient().query(query);
    return result.rows.map(this.castTypes);
  }

  public async search(
    params: Partial<TripSearchInterfaceWithPagination>,
  ): Promise<ResultWithPagination<LightTripInterface>> {
    const { limit, skip } = params;
    const where = this.buildWhereClauses(params);
    const query = {
      text: `
        SELECT
          count(*) over() as total_count,
          trip_id,
          start_town,
          end_town,
          datetime as start_datetime,
          '0'::int as incentives,
          operator_id,
          operator_class
        FROM ${this.table}
        ${where ? where.text : ''}
        ORDER BY datetime DESC
        LIMIT $#::integer
        OFFSET $#::integer
      `,
      values: [...(where ? where.values : []), limit, skip],
    };

    // incentives
    query.text = query.text.split('$#').reduce((acc, current, idx, origin) => {
      if (idx === origin.length - 1) {
        return `${acc}${current}`;
      }

      return `${acc}${current}$${idx + 1}`;
    }, '');

    const result = await this.connection.getClient().query(query);

    const pagination = {
      limit,
      total: 0,
      offset: skip,
    };

    if (result.rows.length === 0) {
      return {
        data: [],
        meta: {
          pagination,
        },
      };
    }

    pagination.total = result.rows[0].total_count;

    let finalDatas = result.rows.map(({ total_count, ...data }) => data).map(this.castTypes);

    return {
      data: finalDatas,
      meta: {
        pagination,
      },
    };
  }

  private castTypes(row: any): any {
    return {
      ...row,
      operator_id: typeof row.operator_id === 'string' ? parseInt(row.operator_id, 10) : row.operator_id,
      start_territory:
        typeof row.start_territory === 'string' ? parseInt(row.start_territory, 10) : row.start_territory,
      end_territory: typeof row.end_territory === 'string' ? parseInt(row.end_territory, 10) : row.end_territory,
    };
  }
}
