import { internalOnlyMiddlewares } from '@pdc/provider-middleware';
import { Action } from '@ilos/core';
import { handler, ContextType, ConfigInterfaceResolver, NotFoundException } from '@ilos/common';
import { BucketName, S3StorageProvider } from '@pdc/provider-file';

import { handlerConfig, ParamsInterface, ResultInterface } from '../shared/trip/publishOpenData.contract';
import { alias } from '../shared/trip/publishOpenData.schema';
import { getOpenDataExportName } from '../helpers/getOpenDataExportName';
import { DataGouvProvider } from '../providers/DataGouvProvider';
import { Dataset, Resource } from '../interfaces';

@handler({
  ...handlerConfig,
  middlewares: [...internalOnlyMiddlewares(handlerConfig.service), ['validate', alias]],
})
export class PublishOpenDataAction extends Action {
  constructor(
    private file: S3StorageProvider,
    private config: ConfigInterfaceResolver,
    private datagouv: DataGouvProvider,
  ) {
    super();
  }

  public async handle(params: ParamsInterface, context: ContextType): Promise<ResultInterface> {
    try {
      const { date, publish } = params;
      const filename = getOpenDataExportName('zip', date);
      const datasetSlug = this.config.get('datagouv.datasetSlug');
      const dataset = await this.datagouv.getDataset(datasetSlug);
      const resource = await this.createResource(filename);
      if (publish) {
        await this.ensureExportIsReachable(filename);
        const rid = await this.datagouv.publishResource(datasetSlug, resource);
        await this.datagouv.checkResource(datasetSlug, rid);
        // await this.datagouv.updateDataset(dataset);
      } else {
        await this.datagouv.unpublishResource(datasetSlug, this.findRidFromTitle(dataset, resource.title));
        // await this.datagouv.updateDataset(dataset);
      }
    } catch (e) {
      throw e;
    }
  }

  protected async ensureExportIsReachable(filename: string): Promise<void> {
    const exportExist = await this.file.exists(BucketName.Export, filename);
    const publicExist = await this.file.exists(BucketName.Public, filename);

    if (!exportExist && !publicExist) {
      throw new NotFoundException(`Export ${filename} is not found`);
    }
    if (exportExist && !publicExist) {
      await this.file.copy(BucketName.Export, filename, BucketName.Public, filename);
    }
  }

  protected findRidFromTitle(dataset: Dataset, title: string): string {
    if (!dataset.resources || dataset.resources.length) {
      throw new NotFoundException(`File ${title} is not found in dataset ${dataset.slug}`);
    }
    const resource = dataset.resources.find((r) => r.title === title);
    if (!resource) {
      throw new NotFoundException(`File ${title} is not found in dataset ${dataset.slug}`);
    }
    return resource.id;
  }

  protected async createResource(filename: string): Promise<Resource> {
    // TODO
    // - add checksum
    // - upload file vs public url ?
    return {
      filetype: 'remote',
      format: 'csv',
      title: filename,
      type: 'main',
      url: await this.file.getPublicUrl(BucketName.Public, filename),
    };
  }
}