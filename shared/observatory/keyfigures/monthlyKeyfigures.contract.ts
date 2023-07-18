export interface SingleResultInterface {
  ter_1: string;
  lng_1: number;
  lat_1: number;
  ter_2: string;
  lng_2: number;
  lat_2: number;
  passengers: number;
  distance: number;
  duration: number;
}

export type ResultInterface = SingleResultInterface[];

export interface ParamsInterface {
  year: number;
  month: number;
  type: string; //type de territoire selectionné
  code?: string; //code insee du territoire observé
  observe?: string; //type du territoire observé
}

export const handlerConfig = {
  service: 'observatory',
  method: 'monthlyKeyfigures',
};

export const signature = `${handlerConfig.service}:${handlerConfig.method}`;
