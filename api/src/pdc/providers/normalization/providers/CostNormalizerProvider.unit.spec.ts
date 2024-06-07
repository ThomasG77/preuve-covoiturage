import { assertEquals, assert, assertFalse, assertThrows, assertObjectMatch, afterEach, beforeEach, afterAll, beforeAll, describe, it } from '@/dev_deps.ts';

import { CostNormalizerProvider } from './CostNormalizerProvider.ts';
import { KernelInterfaceResolver } from '@/ilos/common/index.ts';

class MockedNormalizerCostAction extends CostNormalizerProvider {
  constructor() {
    super(null as unknown as KernelInterfaceResolver);
  }
  protected async getSiret(): Promise<string> {
    return '13002526500013';
  }
}

it('Cost normalization should work', async (t) => {
  const action = new MockedNormalizerCostAction();
  const data = {
    operator_id: 1,
    contribution: 10,
    payment: 10,
    incentives: [
      {
        index: 0,
        siret: '28750007800020',
        amount: 10,
      },
    ],
    payments: [
      {
        index: 0,
        siret: '53996626700012',
        amount: 5,
        type: 'sodexo',
      },
    ],
  };

  const result = await action.handle(data);
  assertObjectMatch(result, {
    cost: 20,
    payment: 10,
    payments: [
      {
        index: 0,
        amount: 10,
        siret: '28750007800020',
        type: 'incentive',
      },
      {
        index: 1,
        amount: 5,
        siret: '53996626700012',
        type: 'payment',
      },
      {
        index: 2,
        amount: 5,
        siret: '13002526500013',
        type: 'payment',
      },
    ],
  });
});
