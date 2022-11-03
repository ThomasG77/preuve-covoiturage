import { NotEligibleTargetException } from '../exceptions/NotEligibleTargetException';
import {
  OperatorsEnum,
  OperatorsIdEnum,
  PolicyHandlerInterface,
  PolicyHandlerParamsInterface,
  PolicyHandlerStaticInterface,
  StatelessContextInterface,
} from '../../interfaces';
import {
  atDate,
  isAfter,
  isOperatorClassOrThrow,
  isOperatorOrThrow,
  onDistanceRange,
  onDistanceRangeOrThrow,
  perKm,
  perSeat,
  endsAt,
  startsAt,
  watchForGlobalMaxAmount,
  watchForPersonMaxAmountByMonth,
  watchForPersonMaxTripByDay,
} from '../helpers';
import { ConfiguredLimitInterface, LimitTargetEnum } from '../helpers/limits';
import { description } from './Idfm.html';
import { AbstractPolicyHandler } from './AbstractPolicyHandler';

// Politique d'Île-de-France Mobilité
/* eslint-disable-next-line */
export const Idfm: PolicyHandlerStaticInterface = class extends AbstractPolicyHandler implements PolicyHandlerInterface {
  static readonly id = '459';
  protected operators = [OperatorsEnum.BlaBlaDaily, OperatorsEnum.Karos, OperatorsEnum.Klaxit];
  protected operators_id = [OperatorsIdEnum.BlaBlaDaily, OperatorsIdEnum.Karos, OperatorsIdEnum.Klaxit];
  protected slices = [
    { start: 2_000, end: 15_000, fn: (ctx: StatelessContextInterface) => perSeat(ctx, 150) },
    {
      start: 15_000,
      end: 30_000,
      fn: (ctx: StatelessContextInterface) => perSeat(ctx, perKm(ctx, { amount: 10, offset: 15_000, limit: 30_000 })),
    },
    {
      start: 30_000,
      end: 150_000,
      fn: () => 0,
    },
  ];
  protected limits: Array<ConfiguredLimitInterface> = [
    ['56042464-852C-95B8-2009-8DD4808C9370', 6, watchForPersonMaxTripByDay, LimitTargetEnum.Driver],
    ['ECDE3CD4-96FF-C9D2-BA88-45754205A798', 150_00, watchForPersonMaxAmountByMonth, LimitTargetEnum.Driver],
    ['99911EAF-89AB-C346-DDD5-BD2C7704F935', 6_000_000_00, watchForGlobalMaxAmount],
  ];

  protected pollutionAndStrikeDates = [
    '2022-02-18',
    '2022-03-25',
    '2022-03-26',
    '2022-03-27',
    '2022-03-28',
    '2022-06-18',
    '2022-07-06',
  ];

  protected processExclusion(ctx: StatelessContextInterface) {
    isOperatorOrThrow(ctx, this.operators);
    onDistanceRangeOrThrow(ctx, { min: 2_000, max: 150_000 });

    // Exclure les trajet Paris-Paris
    if (startsAt(ctx, { com: ['75056'] }) && endsAt(ctx, { com: ['75056'] })) {
      throw new NotEligibleTargetException();
    }

    // Exclure les trajets qui ne sont pas dans l'aom
    if (!startsAt(ctx, { aom: ['217500016'] }) || !endsAt(ctx, { aom: ['217500016'] })) {
      throw new NotEligibleTargetException();
    }

    // Classe de trajet
    isOperatorClassOrThrow(ctx, ['B', 'C']);
    // Modification de la campagne au 1er septembre
    if (isAfter(ctx, { date: new Date('2022-09-01') })) {
      isOperatorClassOrThrow(ctx, ['C']);
    }
  }

  processStateless(ctx: StatelessContextInterface): void {
    this.processExclusion(ctx);
    super.processStateless(ctx);

    // Par kilomètre
    let amount = 0;
    for (const { start, fn } of this.slices) {
      if (onDistanceRange(ctx, { min: start })) {
        amount += fn(ctx);
      }
    }

    // Jour de pollution
    if (atDate(ctx, { dates: this.pollutionAndStrikeDates })) {
      amount *= 1.5;
    }

    ctx.incentive.set(amount);
  }

  params(): PolicyHandlerParamsInterface {
    return {
      slices: this.slices,
      operators: this.operators,
      operators_id: this.operators_id,
      limits: {
        glob: 6_000_000_00,
      },
    };
  }

  describe(): string {
    return description;
  }
};
