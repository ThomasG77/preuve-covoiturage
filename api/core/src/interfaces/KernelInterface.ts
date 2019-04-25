import { RPCCallType } from '../types/RPCCallType';
import { RPCResponseType } from '../types/RPCResponseType';

import { KernelInterface } from './KernelInterface';
import { ServiceProviderConstructorInterface } from './ServiceProviderConstructorInterface';
import { ProviderConstructorInterface } from './ProviderConstructorInterface';
import { CommandConstructorInterface } from './CommandConstructorInterface';
import { ProviderInterface } from './ProviderInterface';
import { TransportConstructorInterface } from './TransportConstructorInterface';

export interface KernelInterface {
  services: ServiceProviderConstructorInterface[];
  providers?: ProviderConstructorInterface[];
  commands?: CommandConstructorInterface[];

  boot():Promise<void> | void;
  handle(call: RPCCallType): Promise<RPCResponseType>;
  get(name: string):ProviderInterface;

  up(transportConstructor: TransportConstructorInterface, opts?: string[]): Promise<void>;
  down(): Promise<void>;
}