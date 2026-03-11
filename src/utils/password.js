const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

module.exports = { hashPassword };
