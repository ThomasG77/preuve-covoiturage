'use strict';
const exec = require('util').promisify(require('child_process').exec);
const path = require('path');
const process = require('process');

/**
 * Cast all foreign keys *_id as integer to match PostgreSQL types
 * Current type is 'varchar' as fkeys were migrated from MongoDB
 * as a toString() of ObjectID objects.
 */
var { createMigration } = require('../helpers/createMigration');

var { setup, up, down } = createMigration(
  ['territory/20200606000004_clean_territory_names'],
  __dirname,
);

exports.setup = setup;
exports.up = up;
exports.down = down;
