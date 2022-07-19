import { MetadataAccessorInterface, MetadataExport } from '../interfaces';

export class MetadataAccessor implements MetadataAccessorInterface {
  constructor(public readonly datetime: Date, public readonly data: Map<string, number> = new Map()) {}

  static import(datetime: Date, data: Map<string, number>): MetadataAccessor {
    return new MetadataAccessor(datetime, data);
  }

  export(): Array<MetadataExport> {
    return [...this.data.entries()].map(([key, value]) => ({ key, value }));
  }

  get(uuid: string): number {
    return this.data.get(uuid);
  }

  set(uuid: string, value: number): void {
    this.data.set(uuid, value);
  }
}
