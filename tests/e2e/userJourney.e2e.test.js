const request = require("supertest");
const bcrypt = require("bcrypt");
const { mockChain } = require("../helpers/mockSupabase");

const mockFrom = jest.fn();
jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));

const app = require("../../src/app");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("E2E: User journey – signup -> login -> update profile", () => {
  let hashedPassword;

  it("signs up a new user", async () => {
    const chain = mockChain({ data: [{ u_id: 42 }], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/signup").send({
      firstname: "Alice",
      lastname: "Wonder",
      email: "alice@example.com",
      password: "securePass1!",
      gender: "Female",
      dob: "1992-04-20",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User created successfully");

    hashedPassword = chain.insert.mock.calls[0][0][0].u_password;
    const match = await bcrypt.compare("securePass1!", hashedPassword);
    expect(match).toBe(true);
  });

  it("logs in with the same credentials", async () => {
    const hashed = await bcrypt.hash("securePass1!", 10);
    const userData = [
      {
        u_id: 42,
        u_firstname: "Alice",
        u_lastname: "Wonder",
        u_email: "alice@example.com",
        u_password: hashed,
      },
    ];
    const chain = mockChain({ data: userData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/authenticate")
      .send({ email: "alice@example.com", password: "securePass1!" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].u_firstname).toBe("Alice");
  });

  it("fetches user profile", async () => {
    const user = {
      u_id: 42,
      u_firstname: "Alice",
      u_lastname: "Wonder",
      u_email: "alice@example.com",
    };
    const chain = mockChain({ data: [user], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/getuser").send({ id: 42 });

    expect(res.status).toBe(200);
    expect(res.body.u_firstname).toBe("Alice");
  });

  it("updates user profile with title and qualification", async () => {
    const chain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/updateprofile").send({
      id: 42,
      title: "Dr",
      qualification: "MBBS, MD",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Profile updated successfully");
    expect(chain.update).toHaveBeenCalledWith({
      u_title: "Dr",
      u_qualification: "MBBS, MD",
    });
  });

  it("changes password and logs in again", async () => {
    // Step 1: update password
    const updateChain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(updateChain);

    const updateRes = await request(app)
      .post("/api/updatepassword")
      .send({ id: 42, password: "newSecure2!" });

    expect(updateRes.body.message).toBe("Password updated successfully");

    const newHash = updateChain.update.mock.calls[0][0].u_password;

    // Step 2: login with new password
    jest.clearAllMocks();
    const loginChain = mockChain({
      data: [
        {
          u_id: 42,
          u_email: "alice@example.com",
          u_password: newHash,
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValue(loginChain);

    const loginRes = await request(app)
      .post("/api/authenticate")
      .send({ email: "alice@example.com", password: "newSecure2!" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body[0].u_id).toBe(42);
  });
});

describe("E2E: Forgot password flow", () => {
  it("checks email exists, then resets password", async () => {
    // Step 1: check email
    const checkChain = mockChain({
      data: [{ u_id: 10, u_email: "bob@x.com" }],
      error: null,
    });
    mockFrom.mockReturnValue(checkChain);

    const checkRes = await request(app)
      .post("/api/forgotpassword")
      .send({ email: "bob@x.com" });

    expect(checkRes.status).toBe(200);
    expect(Array.isArray(checkRes.body)).toBe(true);

    // Step 2: update password
    jest.clearAllMocks();
    const updateChain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(updateChain);

    const updateRes = await request(app)
      .post("/api/updatepassword")
      .send({ id: 10, password: "resetPass!" });

    expect(updateRes.body.message).toBe("Password updated successfully");
  });

  it("returns email not found for unknown email", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/forgotpassword")
      .send({ email: "unknown@x.com" });

    expect(res.body.message).toBe("Email not found");
  });
});
