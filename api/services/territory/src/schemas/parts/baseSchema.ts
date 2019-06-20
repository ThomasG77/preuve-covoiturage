export const baseSchema = {
  name: { macro: 'varchar' },
  shortname: { macro: 'varchar' },
  acronym: { macro: 'varchar' },
  insee: {
    type: 'array',
    items: { macro: 'insee' },
  },
  insee_main: { macro: 'insee' },
  network_id: { type: 'integer' },
};