"use strict";

import { createMigration } from "../helpers/createMigration.js";
var { setup, up, down } = createMigration([
  "certificate/20200728214327-cert-identity_uuid_field",
], __dirname);

exports.setup = setup;
exports.up = up;
exports.down = down;
