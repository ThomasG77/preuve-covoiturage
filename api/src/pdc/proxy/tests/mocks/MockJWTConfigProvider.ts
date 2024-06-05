import _ from 'lodash';
import { ConfigInterface } from '@ilos/common/index.ts';

export class MockJWTConfigProvider implements ConfigInterface {
  get(key: string, fallback?: any): any {
    return _.get(
      {
        jwt: {
          secret: process.env.APP_JWT_SECRET,
          ttl: -1,
          alg: 'HS256',
          signOptions: {},
          verifyOptions: {},
        },
      },
      key,
      fallback,
    );
  }
}
