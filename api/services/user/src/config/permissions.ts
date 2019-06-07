export const aom = {
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
      'aom.users.add',
      'aom.users.list',
      'aom.users.remove',
      'aom.list',
      'aom.read',
      'aom.update',
      'aom.delete',
      'aom.stats',
      'operator.list',
      'operator.read',
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
      'aom.stats',
      'user.list',
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
      'aom.list',
      'aom.read',
      'operator.users.add',
      'operator.users.remove',
      'operator.users.list',
      'operator.app.create',
      'operator.app.delete',
      'operator.app.list',
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
      'aom.users.add',
      'aom.users.remove',
      'aom.users.list',
      'aom.list',
      'aom.read',
      'aom.create',
      'aom.update',
      'aom.delete',
      'aom.stats',
      'operator.users.add',
      'operator.users.remove',
      'operator.users.list',
      'operator.list',
      'operator.read',
      'operator.create',
      'operator.update',
      'operator.delete',
      'journey.read',
      'journey.list',
      'journey.delete',
      'journey.import',
      'journey.process',
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
      'user.list',
      'profile.read',
      'profile.update',
      'profile.password',
      'profile.delete',
    ],
  },
};
