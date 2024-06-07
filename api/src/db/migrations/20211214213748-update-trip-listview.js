"use strict";

import { createMigration } from "../helpers/createMigration.js";
var { setup, up, down } = createMigration([
  "trip/20211214213748_update_trip_listview",
], __dirname);

exports.setup = setup;
exports.up = up;
exports.down = down;
