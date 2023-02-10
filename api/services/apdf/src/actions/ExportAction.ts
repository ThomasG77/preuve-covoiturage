import { ConfigInterfaceResolver, ContextType, handler } from '@ilos/common';
import { Action } from '@ilos/core';
import { BucketName, S3StorageProvider } from '@pdc/provider-file';
import { internalOnlyMiddlewares } from '@pdc/provider-middleware';
import { addMonths, startOfMonth, subMonths } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import fs from 'fs';
import { get } from 'lodash';
import { DataRepositoryProviderInterfaceResolver } from '../interfaces/APDFRepositoryProviderInterface';
import { BuildExcel } from '../providers/excel/BuildExcel';
import { CheckCampaign } from '../providers/excel/CheckCampaign';
import { handlerConfig, ParamsInterface, ResultInterface } from '../shared/apdf/export.contract';
import { alias } from '../shared/apdf/export.schema';
import { ResultInterface as Campaign } from '../shared/policy/find.contract';

@handler({
  ...handlerConfig,
  middlewares: [...internalOnlyMiddlewares('apdf'), ['validate', alias]],
})
export class ExportAction extends Action {
  constructor(
    private checkCampaign: CheckCampaign,
    private s3StorageProvider: S3StorageProvider,
    private tripRepositoryProvider: DataRepositoryProviderInterfaceResolver,
    private buildExcel: BuildExcel,
    private config: ConfigInterfaceResolver,
  ) {
    super();
  }

  public async handle(params: ParamsInterface, context: ContextType): Promise<ResultInterface> {
    const { start_date, end_date } = this.castOrGetDefaultDates(params);
    const verbose = this.isVerbose(context);

    if (verbose) {
      console.info(`$$$ Exporting APDF from ${start_date.toISOString()} to ${end_date.toISOString()}`);
    }

    const files: string[] = [];
    await Promise.all(
      params.query.campaign_id.map(async (c_id) => {
        // Make sure the campaign is active and within the date range
        const campaign: Campaign | void = await this.checkCampaign
          .call(c_id, start_date, end_date)
          .catch((e) => console.error(`Failed campaign ${c_id} export: ${e.message}`));

        if (!campaign) return;

        // List operators having subsidized trips
        const activeOperatorIds =
          params.query.operator_id ||
          (await this.tripRepositoryProvider.getPolicyActiveOperators(campaign._id, start_date, end_date));

        if (!activeOperatorIds.length) console.info(`Exporting APDF: No active operators for ${campaign.name}`);

        if (verbose) {
          console.info(`
            $$$ Building APDF for campaign ${campaign.name}:
            $$$  - start_date: ${campaign.start_date.toISOString()}
            $$$  - end_date:   ${campaign.end_date.toISOString()}
            $$$  - used:       ${campaign.incentive_sum / 100}€
            $$$ Operators :    ${activeOperatorIds.map((i) => `#${i}`).join(', ')}
          `);
        }

        // Generate XLSX files for each operator and upload to S3 storage
        await Promise.all(
          activeOperatorIds.map(async (o_id) => {
            try {
              console.info(`$$$ > Building APDF for campaign ${campaign.name}, operator id ${o_id}`);
              const { filename, filepath } = await this.buildExcel.call(campaign, start_date, end_date, o_id);

              if (!this.config.get('apdf.s3UploadEnabled')) {
                console.warn(
                  'APDF Upload disabled! ' +
                    'Set APP_APDF_S3_UPLOAD_ENABLED=true in .env file' +
                    'Files are available in {project}/tmp',
                );
                return;
              }

              const file = await this.s3StorageProvider.upload(BucketName.APDF, filepath, filename, `${campaign._id}`);

              // maybe delete the file
              try {
                fs.unlinkSync(filepath);
              } catch (e) {
                console.warn(`Failed to unlink ${filepath}`);
              }

              files.push(file);
            } catch (error) {
              // eslint-disable-next-line max-len
              const message = `Failed APDF export for operator ${o_id} (campaign ${campaign._id})`;
              console.error(message);
              files.push(message);
            }
          }),
        );
      }),
    );

    return files;
  }

  private isVerbose(context: ContextType): boolean {
    return get(context, 'channel.transport') === 'cli' && get(context, 'call.metadata.verbose', false);
  }

  private castOrGetDefaultDates(params: ParamsInterface): { start_date: Date; end_date: Date } {
    // use the local times
    const start_date_lc = get(params, 'query.date.start', null);
    const end_date_lc = get(params, 'query.date.end', null);

    // having both
    if (start_date_lc && end_date_lc) {
      return { start_date: new Date(start_date_lc), end_date: new Date(end_date_lc) };
    }

    // make a 1 month date range from start_date
    if (start_date_lc && !end_date_lc) {
      return { start_date: new Date(start_date_lc), end_date: addMonths(start_date_lc, 1) };
    }

    // make a 1 month date range from end_date
    if (!start_date_lc && end_date_lc) {
      return { start_date: subMonths(end_date_lc, 1), end_date: new Date(end_date_lc) };
    }

    // defaults
    const start = startOfMonth(subMonths(new Date(), 1));
    const end = startOfMonth(new Date());

    // timezoned
    return {
      start_date: zonedTimeToUtc(start, params.format?.tz),
      end_date: zonedTimeToUtc(end, params.format?.tz),
    };
  }
}