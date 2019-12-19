import { AcquisitionInterface } from '../acquisition/common/interfaces/AcquisitionInterface';

export type ResultInterface = AcquisitionInterface | AcquisitionInterface[];
export interface ParamsInterface extends AcquisitionInterface {}
export const handlerConfig = {
  service: 'normalization',
  method: 'route',
};
export const signature = `${handlerConfig.service}:${handlerConfig.method}`;