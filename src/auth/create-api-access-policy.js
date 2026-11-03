function createApiAccessPolicy(screenRoles) {
  return Object.freeze(
    Object.fromEntries(Object.keys(screenRoles).map((screen) => [
      screen,
      screen === "hospital" ? "hospital" : screen,
    ])),
  );
}

module.exports = { createApiAccessPolicy };
