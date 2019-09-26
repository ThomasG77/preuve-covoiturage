export const territories = {
  admin: {
    slug: 'admin',
    name: 'Admin',
    permissions: [
      'user.list',
      'user.invite',
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'territory.users.add',
      'territory.users.list',
      'territory.users.remove',
      'territory.users.send-confirm-email',
      'territory.list',
      'territory.read',
      'territory.create',
      'territory.update',
      'territory.delete',
      'territory.stats',
      'territory.trip.list',
      'territory.trip.stats',
      'operator.list',
      'operator.read',
      'application.list',
      'application.find',
      'application.create',
      'application.revoke',
      'journey.read',
      'journey.list',
      'profile.read',
      'profile.update',
      'profile.password',
      'profile.delete',
      'incentive.list',
      'incentive.read',
      'incentive-parameter.list',
      'incentive-parameter.create',
      'incentive-parameter.read',
      'incentive-parameter.update',
      'incentive-parameter.delete',
      'incentive-unit.list',
      'incentive-unit.create',
      'incentive-unit.read',
      'incentive-unit.update',
      'incentive-unit.delete',
      'incentive-policy.list',
      'incentive-policy.create',
      'incentive-policy.read',
      'incentive-policy.update',
      'incentive-policy.delete',
      'incentive-campaign.list',
      'incentive-campaign.create',
      'incentive-campaign.read',
      'incentive-campaign.update',
      'incentive-campaign.delete',
    ],
  },
  user: {
    slug: 'user',
    name: 'User',
    permissions: [
      'territory.stats',
      'user.list',
      'territory.trip.list',
      'territory.trip.stats',
      'journey.read',
      'journey.list',
      'profile.read',
      'profile.update',
      'profile.password',
      'profile.delete',
      'incentive.list',
      'incentive.read',
      'incentive-parameter.list',
      'incentive-parameter.read',
      'incentive-unit.list',
      'incentive-unit.read',
      'incentive-policy.list',
      'incentive-policy.read',
      'incentive-campaign.list',
      'incentive-campaign.read',
    ],
  },
};

export const operators = {
  admin: {
    slug: 'admin',
    name: 'Admin',
    permissions: [
      'user.list',
      'user.invite',
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'territory.list',
      'territory.read',
      'operator.users.add',
      'operator.users.remove',
      'operator.users.list',
      'operator.users.send-confirm-email',
      'operator.application.list',
      'operator.application.find',
      'operator.application.create',
      'operator.application.revoke',
      'operator.list',
      'operator.read',
      'operator.create',
      'operator.update',
      'journey.read',
      'journey.create',
      'journey.list',
      'journey.import',
      'profile.read',
      'profile.update',
      'profile.password',
      'profile.delete',
    ],
  },
  user: {
    slug: 'user',
    name: 'User',
    permissions: [
      'journey.read',
      'journey.list',
      'user.list',
      'profile.read',
      'profile.update',
      'profile.password',
      'profile.delete',
    ],
  },
};

export const registry = {
  admin: {
    slug: 'admin',
    name: 'Admin',
    permissions: [
      'user.list',
      'user.invite',
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'user.send-confirm-email',
      'trip.list',
      'trip.stats',
      ...territories.admin.permissions,
      ...operators.admin.permissions,
      'operator.delete',
      'journey.import',
      'journey.process',
    ],
  },
  user: {
    slug: 'user',
    name: 'User',
    permissions: ['user.list', 'profile.read', 'profile.update', 'profile.password', 'profile.delete'],
  },
};
