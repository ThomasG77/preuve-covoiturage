"use strict";

import { createMigration } from "../helpers/createMigration.js";
var { setup, up, down } = createMigration([
  "territory/20220720000000_add_territory_helpers",
  "policy/20220720000000_update_policy_table",
], __dirname);

exports.setup = setup;
exports.up = up;
exports.down = down;
