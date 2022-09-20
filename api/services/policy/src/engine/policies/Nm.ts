import {
  OperatorsEnum,
  PolicyHandlerInterface,
  PolicyHandlerParamsInterface,
  PolicyHandlerStaticInterface,
  StatefulContextInterface,
  StatelessContextInterface,
} from '../../interfaces';
import { NotEligibleTargetException } from '../exceptions/NotEligibleTargetException';
import {
  endsAt,
  isOperatorClassOrThrow,
  isOperatorOrThrow,
  onDistanceRange,
  onDistanceRangeOrThrow,
  perKm,
  perSeat,
  setMax,
  startsAt,
  watchForGlobalMaxAmount,
  watchForPersonMaxTripByDay,
} from '../helpers';
import { MaximumTargetEnum, watchForGlobalMaxTrip, watchForPassengerMaxByTripByDay } from '../helpers/max';
import { description } from './Nm.html';

export const Nm: PolicyHandlerStaticInterface = class implements PolicyHandlerInterface {
  static readonly id = '656';
  protected operators = [OperatorsEnum.Klaxit];
  protected operatorClass = ['C'];
  protected slices = [
    { start: 2_000, end: 20_000, fn: (ctx: StatelessContextInterface) => perSeat(ctx, 200) },
    { start: 20_000, end: 150_000, fn: (ctx: StatelessContextInterface) => perSeat(ctx, perKm(ctx, { amount: 10 })) },
  ];
  protected limits = [
    setMax('69FD0093-CEEE-0709-BB80-878D2E857630', 10_000_000_00, watchForGlobalMaxAmount),
    setMax('D1FED21B-5160-A1BF-C052-5DA7A190996C', 10_000_000, watchForGlobalMaxTrip),
    setMax('286AAF87-5CDB-A7C0-A599-FBE7FB6C5442', 4, watchForPersonMaxTripByDay, MaximumTargetEnum.Driver),
    setMax('6456EC1D-2183-71DC-B08E-0B8FC30E4A4E', 4, watchForPersonMaxTripByDay, MaximumTargetEnum.Passenger),
    setMax('D5FA9FA9-E8CC-478E-80ED-96FDC5476689', 3, watchForPassengerMaxByTripByDay),
  ];

  protected processExclusion(ctx: StatelessContextInterface) {
    isOperatorOrThrow(ctx, this.operators);
    onDistanceRangeOrThrow(ctx, { min: 2_000 });
    isOperatorClassOrThrow(ctx, this.operatorClass);

    // Exclure les trajets qui ne sont pas dans l'aom NM
    if (!startsAt(ctx, { aom: ['244400404'] }) || !endsAt(ctx, { aom: ['244400404'] })) {
      throw new NotEligibleTargetException();
    }
  }

  processStateless(ctx: StatelessContextInterface): void {
    this.processExclusion(ctx);

    // Mise en place des limites
    for (const limit of this.limits) {
      const [staless] = limit;
      staless(ctx);
    }

    // Par kilomètre
    let amount = 0;
    for (const { start, end, fn } of this.slices) {
      if (onDistanceRange(ctx, { min: start, max: end })) {
        amount = fn(ctx);
      }
    }

    ctx.incentive.set(amount);
  }

  processStateful(ctx: StatefulContextInterface): void {
    for (const limit of this.limits) {
      const [, stateful] = limit;
      stateful(ctx);
    }
  }

  params(): PolicyHandlerParamsInterface {
    return {
      slices: this.slices,
      operators: this.operators,
      limits: {
        glob: 10_000_000_00,
      },
    };
  }

  describe(): string {
    return description;
  }
};
