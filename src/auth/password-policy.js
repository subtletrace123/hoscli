function isPasswordCompliant(password) {
  if (typeof password !== "string") {
    return false;
  }

  const length = Array.from(password).length;

  return (
    length >= 8 &&
    length <= 64 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[\p{P}\p{S}]/u.test(password)
  );
}

module.exports = { isPasswordCompliant };
