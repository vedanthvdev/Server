const bcrypt = require("bcrypt");
const { hashPassword } = require("../../src/utils/password");

describe("hashPassword", () => {
  it("returns a bcrypt hash of the input", async () => {
    const hash = await hashPassword("mySecret123");
    expect(hash).not.toBe("mySecret123");
    const match = await bcrypt.compare("mySecret123", hash);
    expect(match).toBe(true);
  });

  it("produces different hashes for the same input (unique salts)", async () => {
    const hash1 = await hashPassword("samePassword");
    const hash2 = await hashPassword("samePassword");
    expect(hash1).not.toBe(hash2);
  });

  it("does not match a different password", async () => {
    const hash = await hashPassword("correctPassword");
    const match = await bcrypt.compare("wrongPassword", hash);
    expect(match).toBe(false);
  });
});
