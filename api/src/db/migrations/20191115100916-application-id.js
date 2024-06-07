"use strict";

import { createMigration } from "../helpers/createMigration.js";
var { setup, up, down } = createMigration([
  "application/20191115100916_application_id",
], __dirname);

exports.setup = setup;
exports.up = up;
exports.down = down;
