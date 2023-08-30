import { RPCException } from './RPCException';

export class TooManyRequestsException extends RPCException {
  constructor(data?: any) {
    super('Too Many Requests Error');
    this.rpcError = {
      data,
      nolog: true,
      code: -32029,
      message: this.message,
    };
  }
}
