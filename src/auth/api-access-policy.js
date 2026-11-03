const { SCREEN_ROLES } = require("./screen-access-policy");
const { createApiAccessPolicy } = require("./create-api-access-policy");

const API_TARGET_SCREENS = createApiAccessPolicy(SCREEN_ROLES);

module.exports = { API_TARGET_SCREENS };
