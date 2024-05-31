import { PostgresConnection } from '@ilos/connection-postgres/index.ts';
import { createDatabase, dropDatabase, migrate } from '@db/index.ts';
import { parse, Options as ParseOptions } from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { URL } from 'url';
import { Carpool, carpools, carpoolsV2 } from './carpools.ts';
import { companies, Company } from './companies.ts';
import { Operator, operators } from './operators.ts';
import { CreateTerritoryGroupInterface, TerritorySelectorsInterface, territory_groups } from './territories.ts';
import { User, users } from './users.ts';
import { add } from 'date-fns';
export class Migrator {
  public connection: PostgresConnection;
  public currentConnectionString: string;
  public config: {
    driver: string;
    user: string;
    password: string;
    host: string;
    database: string;
    port: number;
    ssl: boolean;
    verbose: boolean;
  };
  public readonly dbName: string;
  public readonly dbIsCreated: boolean;

  constructor(dbUrlString: string, newDatabase = true) {
    const dbUrl = new URL(dbUrlString);
    this.config = {
      driver: 'pg',
      user: dbUrl.username,
      password: dbUrl.password,
      host: dbUrl.hostname,
      database: dbUrl.pathname.replace('/', ''),
      port: parseInt(dbUrl.port, 10),
      ssl: false,
      verbose: false,
    };
    this.dbIsCreated = newDatabase;
    this.dbName = newDatabase
      ? `test_${Date.now().valueOf()}_${(Math.random() + 1).toString(36).substring(7)}`
      : dbUrl.pathname.replace('/', '');
    const currentConnection = new URL(dbUrlString);
    if (newDatabase) {
      currentConnection.pathname = `/${this.dbName}`;
    }
    this.currentConnectionString = currentConnection.toString();
  }

  async up() {
    this.connection = new PostgresConnection({
      ...this.config,
      database: this.dbName,
    });
    await this.connection.up();
  }

  async create() {
    if (this.dbIsCreated) {
      await createDatabase(this.config, this.dbName);
    }
  }

  async migrate() {
    await migrate({
      ...this.config,
      database: this.dbName,
    });
  }

  async seed() {
    if (!this.connection) {
      await this.up();
    }

    console.debug('[migrator] seeding...');

    await this.connection.getClient().query<any>(`SET session_replication_role = 'replica'`);

    for (const company of companies) {
      this.config.verbose && console.debug(`Seeding company ${company.legal_name}`);
      await this.seedCompany(company);
    }

    this.config.verbose && console.debug(`Seeding geo`);
    await this.seedTerritory();

    for (const operator of operators) {
      this.config.verbose && console.debug(`Seeding operator ${operator.name}`);
      await this.seedOperator(operator);
    }

    for (const user of users) {
      this.config.verbose && console.debug(`Seeding user ${user.email}`);
      await this.seedUser(user);
    }

    for (const territory_group of territory_groups) {
      this.config.verbose && console.debug(`Seeding territory group ${territory_group.name}`);
      await this.seedTerritoryGroup(territory_group);
    }

    for (const carpool of carpools) {
      this.config.verbose && console.debug(`Seeding carpool ${carpool.acquisition_id}`);
      await this.seedCarpool(carpool);
    }
    for (const carpool of carpoolsV2) {
      this.config.verbose && console.debug(`Seeding carpool ${carpool[0].acquisition_id}`);
      await this.seedCarpoolV2(carpool);
    }

    /*
          - Territoires
            - company.companies

          - Operateurs
            - operator.operators
            - operator.thumbnails
            - application.applications
            - company.companies
            - territory.territory_operators

          - Politiques
            - policy.policies

          - Trajets
            - acquisition.acquisitions
            - carpool.carpools
            - carpool.identities

          - Liste des tables
            - certificates.**
            - honor.tracking
            - fraudcheck.fraudchecks
            - policy.policy_metas
            - policy.incentives
            +++ VIEWS +++ 
    */
    await this.connection.getClient().query<any>(`SET session_replication_role = 'origin'`);
  }

  protected async *dataFromCsv<P>(filename: string, options: ParseOptions = {}): AsyncIterator<P> {
    const filepath = path.join(__dirname, filename);
    const parser = fs.createReadStream(filepath).pipe(
      parse({
        cast: (v: any) => (v === '' ? null : v),
        ...options,
      }),
    );
    for await (const record of parser) {
      yield record;
    }
  }

  protected async seedFromCsv(filename: string, tablename: string, csvOptions: ParseOptions = {}) {
    const cursor = this.dataFromCsv(filename);
    let done = false;
    do {
      const data = await cursor.next();
      if (data.value && Array.isArray(data.value)) {
        await this.connection.getClient().query<any>({
          text: `INSERT INTO ${tablename} VALUES (${data.value.map((_, i) => `$${i + 1}`).join(', ')})`,
          values: data.value,
        });
      }
      done = !!data.done;
    } while (!done);
  }

  async seedCarpoolV2([driverCarpool, passengerCarpool]: [Carpool, Carpool]) {
    console.debug('seedCarpoolV2', { acquisition_Id: driverCarpool.acquisition_id });
    const carpoolResult = await this.connection.getClient().query({
      text: `INSERT INTO carpool_v2.carpools (
        operator_id,
        operator_journey_id,
        operator_trip_id,
        operator_class,
        start_datetime,
        start_position,
        end_datetime,
        end_position,
        distance,
        licence_plate,
        driver_identity_key,
        driver_operator_user_id,
        driver_phone,
        driver_phone_trunc,
        driver_travelpass_name,
        driver_travelpass_user_id,
        driver_revenue,
        passenger_identity_key,
        passenger_operator_user_id,
        passenger_phone,
        passenger_phone_trunc,
        passenger_travelpass_name,
        passenger_travelpass_user_id,
        passenger_over_18,
        passenger_seats,
        passenger_contribution,
        passenger_payments,
        legacy_id
      ) VALUES(
        $1,
        $2,
        $3,
        $4,
        $5,
        ST_SetSRID(ST_Point($6, $7), 4326),
        $8,
        ST_SetSRID(ST_Point($9, $10), 4326),
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $21,
        $22,
        $23,
        $24,
        $25,
        $26,
        $27,
        $28,
        $29,
        $30
      )
      ON CONFLICT (operator_id, operator_journey_id) DO NOTHING
      RETURNING _id, uuid, created_at, updated_at
    `,
      values: [
        driverCarpool.operator_id,
        driverCarpool.operator_journey_id,
        driverCarpool.operator_trip_id,
        driverCarpool.operator_class,
        driverCarpool.datetime,
        driverCarpool.start_position.lon,
        driverCarpool.start_position.lat,
        add(driverCarpool.datetime, { seconds: driverCarpool.duration }),
        driverCarpool.end_position.lon,
        driverCarpool.end_position.lat,
        driverCarpool.distance,
        driverCarpool.licence_plate,
        driverCarpool.identity_key,
        driverCarpool.identity_operator_user_id,
        driverCarpool.identity_phone,
        driverCarpool.identity_phone_trunc,
        driverCarpool.identity_travelpass_name,
        driverCarpool.identity_travelpass_user_id,
        driverCarpool.cost,
        passengerCarpool.identity_key,
        passengerCarpool.identity_operator_user_id,
        passengerCarpool.identity_phone,
        passengerCarpool.identity_phone_trunc,
        passengerCarpool.identity_travelpass_name,
        passengerCarpool.identity_travelpass_user_id,
        passengerCarpool.identity_over_18,
        passengerCarpool.seats,
        passengerCarpool.cost,
        JSON.stringify(passengerCarpool.payments),
        driverCarpool.acquisition_id,
      ],
    });

    await this.connection.getClient().query({
      text: `
        INSERT INTO carpool_v2.requests (
          carpool_id, operator_id, operator_journey_id, payload, api_version, cancel_code, cancel_message
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING _id, created_at
      `,
      values: [
        carpoolResult.rows[0]._id,
        driverCarpool.operator_id,
        driverCarpool.operator_journey_id,
        null,
        3,
        null,
        null,
      ],
    });

    await this.connection.getClient().query({
      text: `
      INSERT INTO carpool_v2.geo (
        carpool_id, start_geo_code, end_geo_code, errors
      ) VALUES (
        $1,
        $2,
        $3,
        $4
      )
      ON CONFLICT (carpool_id)
      DO UPDATE
      SET
        start_geo_code = excluded.start_geo_code,
        end_geo_code = excluded.end_geo_code,
        errors = excluded.errors::jsonb
      `,
      values: [carpoolResult.rows[0]._id, driverCarpool.start_geo_code, driverCarpool.end_geo_code, JSON.stringify([])],
    });

    await this.connection.getClient().query({
      text: `
      INSERT INTO carpool_v2.status (
        carpool_id, acquisition_status
      ) VALUES (
        $1,
        $2
      )
      `,
      values: [carpoolResult.rows[0]._id, 'processed'],
    });
  }

  async seedCarpool(carpool: Carpool) {
    const result = await this.connection.getClient().query<any>({
      text: `
        INSERT INTO carpool.identities 
          (uuid, travel_pass_user_id, over_18, phone_trunc)
        VALUES (
          $1::uuid,
          $2::varchar,
          $3::boolean,
          $4::varchar
        )
        ON CONFLICT DO NOTHING
        RETURNING _id
      `,
      values: [
        carpool.identity_uuid,
        carpool.identity_travel_pass,
        carpool.identity_over_18,
        carpool.identity_phone_trunc,
      ],
    });

    await this.connection.getClient().query<any>({
      text: `
        INSERT INTO carpool.carpools 
          (
            identity_id,
            acquisition_id,
            operator_id,
            trip_id,
            status,
            is_driver,
            operator_class,
            datetime,
            duration,
            start_position,
            start_geo_code,
            end_position,
            end_geo_code,
            distance,
            seats,
            operator_trip_id,
            cost,
            operator_journey_id,
            meta
          )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT DO NOTHING
      `,
      values: [
        result.rows[0]?._id,
        carpool.acquisition_id,
        carpool.operator_id,
        carpool.trip_id,
        carpool.status,
        carpool.is_driver,
        carpool.operator_class,
        carpool.datetime,
        carpool.duration,
        `POINT(${carpool.start_position.lon} ${carpool.start_position.lat})`,
        carpool.start_geo_code,
        `POINT(${carpool.end_position.lon} ${carpool.end_position.lat})`,
        carpool.end_geo_code,
        carpool.distance,
        carpool.seats,
        carpool.operator_trip_id,
        carpool.cost,
        carpool.operator_journey_id,
        JSON.stringify({
          calc_distance: carpool.calc_distance,
          calc_duration: carpool.calc_duration,
        }),
      ],
    });

    await this.connection.getClient().query<any>({
      text: `
        INSERT INTO acquisition.acquisitions
          (
            _id,
            application_id,
            operator_id,
            journey_id,
            payload,
            status
          )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `,
      values: [carpool.acquisition_id, 1, carpool.operator_id, carpool.operator_journey_id, JSON.stringify({}), 'ok'],
    });

    await this.connection.getClient().query<any>(`
        SELECT
          setval(
            'acquisition.acquisitions__id_seq',
            (SELECT max(_id) FROM acquisition.acquisitions),
            true
          )
        `);
  }

  async seedCompany(company: Company) {
    await this.connection.getClient().query<any>({
      text: `
        INSERT INTO company.companies
          (_id, siret, siren, nic, legal_name, company_naf_code, establishment_naf_code, headquarter)
        VALUES (
          $1::int,
          $2::varchar,
          $3::varchar,
          $4::varchar,
          $5::varchar,
          $6::varchar,
          $7::varchar,
          $8::boolean
        )
        ON CONFLICT DO NOTHING
      `,
      values: [
        company._id,
        company.siret,
        company.siren,
        company.nic,
        company.legal_name,
        company.company_naf_code,
        company.establishment_naf_code,
        company.headquarter,
      ],
    });
  }

  async seedOperator(operator: Operator) {
    await this.connection.getClient().query<any>({
      text: `
        INSERT INTO operator.operators
          (_id, name, legal_name, siret, company, address, bank, contacts, uuid)
        VALUES (
          $1::int,
          $2::varchar,
          $3::varchar,
          $4::varchar,
          $5::json,
          $6::json,
          $7::json,
          $8::json,
          $9::uuid
        )
        ON CONFLICT DO NOTHING
      `,
      values: [
        operator._id,
        operator.name,
        operator.legal_name,
        operator.siret,
        operator.company,
        operator.address,
        operator.bank,
        operator.contacts,
        operator.uuid,
      ],
    });
  }

  async seedUser(user: User) {
    await this.connection.getClient().query<any>({
      text: `
        INSERT INTO auth.users
          (email, firstname, lastname, password, status, role, territory_id, operator_id)
        VALUES (
          $1::varchar,
          $2::varchar,
          $3::varchar,
          $4::varchar,
          $5::auth.user_status_enum,
          $6::varchar,
          $7::int,
          $8::int
        )
        ON CONFLICT DO NOTHING 
      `,
      values: [
        user.email,
        user.firstname,
        user.lastname,
        user.password, // TODO: use cryptoprovider tcrypt password
        user.status,
        user.role,
        user.territory?._id,
        user.operator?._id,
      ],
    });
  }

  async seedTerritoryGroup(territory_group: CreateTerritoryGroupInterface) {
    const fields = ['_id', 'name', 'shortname', 'contacts', 'address', 'company_id'];

    const values: any[] = [
      territory_group._id,
      territory_group.name,
      '',
      territory_group.contacts,
      territory_group.address,
      territory_group.company_id,
    ];
    const query = {
      text: `
        INSERT INTO territory.territory_group (${fields.join(',')})
        VALUES (${fields.map((data, ind) => `$${ind + 1}`).join(',')})
        RETURNING *
      `,
      values,
    };
    const resultData = await this.connection.getClient().query<any>(query);
    this.syncSelector(resultData.rows[0]._id, territory_group.selector);
  }

  async syncSelector(groupId: number, selector: TerritorySelectorsInterface): Promise<void> {
    const values: [number[], string[], string[]] = Object.keys(selector)
      .map((type) => selector[type].map((value: string | number) => [groupId, type, value.toString()]))
      .reduce((arr, v) => [...arr, ...v], [])
      .reduce(
        (arr, v) => {
          arr[0].push(v[0]);
          arr[1].push(v[1]);
          arr[2].push(v[2]);
          return arr;
        },
        [[], [], []],
      );
    await this.connection.getClient().query<any>({
      text: `
        DELETE FROM territory.territory_group_selector
        WHERE territory_group_id = $1
      `,
      values: [groupId],
    });

    await this.connection.getClient().query<any>({
      text: `
        INSERT INTO territory.territory_group_selector (
          territory_group_id,
          selector_type,
          selector_value
        ) 
        SELECT * FROM UNNEST($1::int[], $2::varchar[], $3::varchar[])`,
      values,
    });
  }

  async seedTerritory() {
    await this.seedFromCsv('./geo.csv', 'geo.perimeters');
  }

  async down() {
    if (this.connection) {
      await this.connection.down();
    }
  }

  async drop() {
    if (this.dbIsCreated) {
      await dropDatabase(this.config, this.dbName);
    }
  }
}
