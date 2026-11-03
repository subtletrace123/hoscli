const HTTPS_PROTOCOL = "https";
const SECURITY_HEADERS = Object.freeze({
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'",
});

module.exports = { HTTPS_PROTOCOL, SECURITY_HEADERS };
