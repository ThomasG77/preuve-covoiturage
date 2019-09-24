import { RuleInterface } from './RuleInterface';

export interface CampaignInterface {
  _id?: string;
  parent_id?: string;
  ui_status?: any;
  territory_id: string;
  name: string;
  description: string;
  start: Date;
  end: Date;
  unit: string;
  status: string;
  global_rules: RuleInterface[];
  rules: RuleInterface[];
}
