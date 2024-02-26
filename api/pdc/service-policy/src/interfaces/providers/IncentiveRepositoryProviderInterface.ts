import { SerializedIncentiveInterface, IncentiveStatusEnum } from '..';

export abstract class IncentiveRepositoryProviderInterfaceResolver {
  abstract updateStatefulAmount(
    data: Array<SerializedIncentiveInterface<number>>,
    status?: IncentiveStatusEnum,
  ): Promise<void>;
  abstract createOrUpdateMany(data: Array<SerializedIncentiveInterface<undefined>>): Promise<void>;
  abstract disableOnCanceledTrip(): Promise<void>;
  abstract lockAll(before: Date, failure?: boolean): Promise<void>;
  abstract findDraftIncentive(
    to: Date,
    batchSize?: number,
    from?: Date,
  ): AsyncGenerator<Array<SerializedIncentiveInterface<number>>, void, void>;
  abstract updateIncentiveSum(): Promise<void>;
}
