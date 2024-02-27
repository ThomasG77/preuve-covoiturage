import { HandlebarsTemplateProvider } from '@pdc/providers/template';
import { NotificationMailTransporter } from './NotificationMailTransporter';
export { AbstractMailNotification } from './AbstractNotification';
export * from './interfaces';
export * from './templates/DefaultNotification';

export const defaultNotificationBindings = [HandlebarsTemplateProvider, NotificationMailTransporter];

export { NotificationMailTransporter };
