'use strict';

var { createMigration } = require('../helpers/createMigration');
var { setup, up, down } = createMigration(['trip/20210923075129_fix_hydrate_trip_fn'], __dirname);

exports.setup = setup;
exports.up = up;
exports.down = down;
