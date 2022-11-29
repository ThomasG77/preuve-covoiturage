import { ApplicationCooldownConstraint, TimeRangeConstraint, ValidJourneyConstraint } from '../interfaces';

export const validJourneyConstraint: ValidJourneyConstraint = {
  operator_class: 'C',
  start_date: new Date('2023-01-01T00:00:00.000Z'),
  end_date: new Date('2024-01-01T00:00:00.000Z'),
  max_distance: 80_000,
  geo_pattern: '99%',
};

// Le temps exprimé en année à partir duquel une nouvelle demande peut être réalisée
export const applicationCooldownConstraint: ApplicationCooldownConstraint = {
  short: {
    specific: 3,
    standardized: 5,
  },
  long: {
    specific: 5,
    standardized: 12,
  },
};

// TODO : configure
export const timeRangeConstraint: TimeRangeConstraint = {
  short: (d: Date) => {
    return true;
  },
  long: (d: Date) => {
    return true;
  },
};
