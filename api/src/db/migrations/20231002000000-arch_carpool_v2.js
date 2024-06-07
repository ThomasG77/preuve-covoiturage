"use strict";

import { createMigration } from "../helpers/createMigration.js";
var { setup, up, down } = createMigration(
  [
    "arch_carpool/20230920000000-create_carpool_v2",
  ],
  __dirname,
);

exports.setup = setup;
exports.up = up;
exports.down = down;
