/* eslint-disable max-len */
import { provider } from '@ilos/common';
import { PostgresConnection } from '@ilos/connection-postgres';
import { set } from 'lodash';
import {
  CampaignSearchParamsInterface,
  DataRepositoryInterface,
  DataRepositoryProviderInterfaceResolver,
} from '../interfaces/APDFRepositoryProviderInterface';
import { APDFTripInterface } from '../interfaces/APDFTripInterface';
import { PolicyStatsInterface } from '@shared/apdf/interfaces/PolicySliceStatInterface';
import { PgCursorHandler } from '@shared/common/PromisifiedPgCursor';
import { UnboundedSlices } from '@shared/policy/common/interfaces/Slices';

@provider({ identifier: DataRepositoryProviderInterfaceResolver })
export class DataRepositoryProvider implements DataRepositoryInterface {
  /**
   * @deprecated [carpool_v2_migration]
   **/
  protected readonly carpoolV1Table = 'carpool.carpools';
  protected readonly carpoolV2Table = 'carpool_v2.carpools';
  protected readonly carpoolV2StatusTable = 'carpool_v2.status';
  protected readonly carpoolV2GeoTable = 'carpool_v2.geo';
  protected readonly policyIncentivesTable = 'policy.incentives';
  protected readonly geoPerimetersTable = 'geo.perimeters';
  protected readonly operatorsTable = 'operator.operators';

  constructor(public connection: PostgresConnection) {}

  /**
   * List active operators having trips and incentives > 0
   * in the campaign for the given date range
   */
  public async getPolicyActiveOperators(campaign_id: number, start_date: Date, end_date: Date): Promise<number[]> {
    const result = await this.connection.getClient().query<any>({
      text: `
        select cc.operator_id
        from policy.incentives pi
        join ${this.carpoolV1Table} cc on cc._id = pi.carpool_id
        where
              pi.policy_id = $3
          and pi.amount    >  0
          and cc.datetime >= $1
          and cc.datetime <  $2
          and cc.status   = 'ok'
        group by cc.operator_id
        order by cc.operator_id
      `,
      values: [start_date, end_date, campaign_id],
    });

    return result.rowCount ? result.rows.map((r) => r.operator_id) : [];
  }

  /**
   * Compile stats on carpools applying slices
   */
  public async getPolicyStats(
    params: CampaignSearchParamsInterface,
    slices: UnboundedSlices | [],
  ): Promise<PolicyStatsInterface> {
    const { start_date, end_date, operator_id, campaign_id } = params;

    // prepare slice filters
    const sliceFilters: string = slices
      .map(({ start, end }, i: number) => {
        const f = `filter (where distance >= ${start}${end ? ` and distance < ${end}` : ''})`;
        return `
          (count(uuid) ${f})::int as slice_${i}_count,
          (count(uuid) ${f.replace('where', 'where amount > 0 and')})::int as slice_${i}_subsidized,
          (sum(amount) ${f})::int as slice_${i}_sum,
          ${start} as slice_${i}_start,
          ${end ? end : "'Infinity'"} as slice_${i}_end
        `;
      })
      .join(',');

    // select all trips with a positive incentive calculated by us for a given campaign
    // calculate a global count and incentive sum as well as details for each slice
    const query = {
      text: `
        with trips as (
          select
              cc.uuid,
              cc.distance,
              coalesce(pi.amount, 0) as amount
          from ${this.policyIncentivesTable} pi
          join ${this.carpoolV2Table} cc
            on  cc.operator_id = pi.operator_id
            and cc.operator_journey_id = pi.operator_journey_id
          join ${this.carpoolV2StatusTable} cs on cs.carpool_id = cc._id
        where
                cc.start_datetime >= $1
            and cc.start_datetime  < $2
            and cs.acquisition_status in ('processed', 'canceled', 'updated')
            and cs.fraud_status       in ('passed', 'failed')
            and cc.operator_id = $3
            and pi.policy_id = $4
            and pi.status = 'validated'
            and pi.amount >= 0
          )
        select
          count(uuid)::int as total_count,
          sum(amount)::int as total_sum,
          (count(uuid) filter (where amount > 0))::int as subsidized_count
          ${sliceFilters.length ? `, ${sliceFilters}` : ''}
        from trips
        `,
      values: [start_date, end_date, operator_id, campaign_id],
    };

    const result = await this.connection.getClient().query<any>(query);

    // return null results on missing data
    if (!result.rowCount) {
      return {
        total_count: 0,
        total_sum: 0,
        subsidized_count: 0,
        slices: [],
      };
    }

    // rearrange the return object
    const row = result.rows[0];
    return Object.keys(row).reduce(
      (p, k) => {
        if (!k.includes('slice_')) return p;
        const [, i, prop] = k.split('_');
        if (prop === 'start') {
          set(p, `slices.${i}.slice.start`, row[k]);
        } else if (prop === 'end') {
          // Highest slice can return Infinity as boundary
          set(p, `slices.${i}.slice.end`, row[k] === 'Infinity' ? undefined : row[k]);
        } else {
          set(p, `slices.${i}.${prop}`, row[k]);
        }
        return p;
      },
      {
        total_count: row.total_count,
        total_sum: row.total_sum,
        subsidized_count: row.subsidized_count,
        slices: [],
      },
    );
  }

  /**
   * List all carpools for CSV APDF export using a cursor
   */
  public async getPolicyCursor(params: CampaignSearchParamsInterface): Promise<PgCursorHandler<APDFTripInterface>> {
    const { start_date, end_date, operator_id, campaign_id } = params;

    const queryText = `
      -- list in api/services/trip/src/providers/excel/TripsWorksheetWriter.ts
      select
        cc.uuid as rpc_journey_id,
        cc.operator_journey_id,
        cc.operator_trip_id,

        cc.driver_operator_user_id,
        cc.passenger_operator_user_id,

        pi.amount as rpc_incentive,

        cc.start_datetime,
        cc.end_datetime,

        gps.l_arr as start_location,
        gps.arr as start_insee,
        gps.l_epci as start_epci,
        gpe.l_arr as end_location,
        gpe.arr as end_insee,
        gpe.l_epci as end_epci,

        to_char(cc.end_datetime - cc.start_datetime, 'HH24:MI:SS') as duration,
        cc.distance,

        oo.name as operator,
        cc.operator_class

      from ${this.policyIncentivesTable} pi
      join ${this.carpoolV2Table} cc on cc.operator_id = pi.operator_id and cc.operator_journey_id = pi.operator_journey_id
      join ${this.carpoolV2StatusTable} cs on cc._id = cs.carpool_id
      join ${this.carpoolV2GeoTable} cg on cc._id = cg.carpool_id
      left join ${this.geoPerimetersTable} gps on cg.start_geo_code = gps.arr and gps.year = geo.get_latest_millesime_or(extract(year from cc.start_datetime)::smallint)
      left join ${this.geoPerimetersTable} gpe on cg.end_geo_code = gpe.arr and gpe.year = geo.get_latest_millesime_or(extract(year from cc.end_datetime)::smallint)
      left join ${this.operatorsTable} oo on oo._id = cc.operator_id

      where
            cc.start_datetime >= $1
        and cc.start_datetime  < $2
        and cs.acquisition_status in ('processed', 'canceled', 'updated')
        and cs.fraud_status in ('passed', 'failed')
        and cc.operator_id = $3
        and pi.policy_id = $4
        and pi.status = 'validated'
        and pi.amount >= 0

      order by cc.start_datetime
    `;

    return this.connection.getCursor(queryText, [start_date, end_date, operator_id, campaign_id]);
  }
}
