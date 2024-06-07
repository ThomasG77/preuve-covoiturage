"use strict";

import { createMigration } from "../helpers/createMigration.js";
var { setup, up, down } = createMigration([
  "policy/20191204100000_update_policy_meta_table",
], __dirname);

exports.setup = setup;
exports.up = up;
exports.down = down;
