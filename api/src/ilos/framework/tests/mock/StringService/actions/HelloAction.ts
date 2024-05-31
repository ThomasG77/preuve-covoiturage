import { Action } from '@ilos/core/index.ts';
import {
  handler,
  ConfigInterfaceResolver,
  ParamsType,
  ContextType,
  ResultType,
  InvalidParamsException,
} from '@ilos/common/index.ts';

import { CustomProvider } from '../../Providers/CustomProvider.ts';

@handler({
  service: 'string',
  method: 'hello',
})
export class HelloAction extends Action {
  constructor(
    public custom: CustomProvider,
    private config: ConfigInterfaceResolver,
  ) {
    super();
  }

  protected async handle(params: ParamsType, context: ContextType): Promise<ResultType> {
    if (Array.isArray(params) || !('name' in params)) {
      throw new InvalidParamsException();
    }
    const sentence = this.config.get('string.hello');
    return `${this.custom.get()}${sentence} ${params.name}`;
  }
}
