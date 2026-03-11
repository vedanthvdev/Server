const bcrypt = require("bcrypt");
const { mockChain } = require("../helpers/mockSupabase");

const mockFrom = jest.fn();
jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));

const authRouter = require("../../src/routes/auth");

const express = require("express");
const app = express();
app.use(express.json());
app.use("/api", authRouter);

const request = require("supertest");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/signup", () => {
  it("inserts user with hashed password and returns 201", async () => {
    const chain = mockChain({ data: [{ u_id: 1 }], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/signup").send({
      firstname: "John",
      lastname: "Doe",
      email: "john@example.com",
      password: "secret123",
      gender: "Male",
      dob: "1990-01-01",
    });

    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(chain.insert).toHaveBeenCalled();

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.u_email).toBe("john@example.com");
    expect(insertArg.u_firstname).toBe("John");
    const isHashed = await bcrypt.compare("secret123", insertArg.u_password);
    expect(isHashed).toBe(true);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User created successfully");
  });

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: { message: "duplicate" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/signup").send({
      firstname: "John",
      lastname: "Doe",
      email: "john@example.com",
      password: "secret123",
      gender: "Male",
      dob: "1990-01-01",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Unable to create user");
  });
});

describe("POST /api/authenticate", () => {
  it("returns user data on valid credentials", async () => {
    const hashed = await bcrypt.hash("pass123", 10);
    const userData = [{ u_id: 1, u_email: "a@b.com", u_password: hashed }];
    const chain = mockChain({ data: userData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/authenticate")
      .send({ email: "a@b.com", password: "pass123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(userData);
  });

  it("returns message on wrong password", async () => {
    const hashed = await bcrypt.hash("correct", 10);
    const chain = mockChain({
      data: [{ u_id: 1, u_email: "a@b.com", u_password: hashed }],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/authenticate")
      .send({ email: "a@b.com", password: "wrong" });

    expect(res.body.message).toBe("Wrong email/password");
  });

  it("returns message when email not found", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/authenticate")
      .send({ email: "no@one.com", password: "x" });

    expect(res.body.message).toBe("Email doesn't exist..");
  });

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: null });
    chain.then = () => {
      throw new Error("DB failure");
    };
    chain.catch = jest.fn((handler) => {
      handler(new Error("DB failure"));
      return chain;
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/authenticate")
      .send({ email: "a@b.com", password: "x" });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/emailalreadyregistered", () => {
  it("returns message when email exists", async () => {
    const chain = mockChain({
      data: [{ u_id: 1, u_email: "test@example.com" }],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/emailalreadyregistered")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email already exists");
  });

  it("returns empty object when email not found", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/emailalreadyregistered")
      .send({ email: "new@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: { message: "fail" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/emailalreadyregistered")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/getuser", () => {
  it("returns user details by id", async () => {
    const user = { u_id: 1, u_firstname: "John", u_lastname: "Doe" };
    const chain = mockChain({ data: [user], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/getuser").send({ id: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
  });

  it("returns message when user not found", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/getuser").send({ id: 999 });

    expect(res.body.message).toBe("Cannot find the User");
  });

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: new Error("DB") });
    chain.then = () => {
      throw new Error("DB");
    };
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/getuser").send({ id: 1 });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/forgotpassword", () => {
  it("returns user data when email exists", async () => {
    const userData = [{ u_id: 1, u_email: "a@b.com" }];
    const chain = mockChain({ data: userData, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/forgotpassword")
      .send({ email: "a@b.com" });

    expect(res.body).toEqual(userData);
  });

  it("returns message when email not found", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/forgotpassword")
      .send({ email: "nope@x.com" });

    expect(res.body.message).toBe("Email not found");
  });
});

describe("POST /api/updatepassword", () => {
  it("updates password with a new hash", async () => {
    const chain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/updatepassword")
      .send({ id: 1, password: "newpass123" });

    expect(res.body.message).toBe("Password updated successfully");
    expect(chain.update).toHaveBeenCalled();
    const updateArg = chain.update.mock.calls[0][0];
    const isHashed = await bcrypt.compare("newpass123", updateArg.u_password);
    expect(isHashed).toBe(true);
  });

  it("returns error on DB failure", async () => {
    const chain = mockChain({ data: null, error: { message: "DB err" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/updatepassword")
      .send({ id: 1, password: "x" });

    expect(res.body.error).toBe("DB err");
  });
});

describe("POST /api/updateprofile", () => {
  it("updates user title and qualification", async () => {
    const chain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/updateprofile")
      .send({ id: 1, title: "Dr", qualification: "MBBS" });

    expect(res.body.message).toBe("Profile updated successfully");
    expect(chain.update).toHaveBeenCalledWith({
      u_title: "Dr",
      u_qualification: "MBBS",
    });
  });

  it("returns error on DB failure", async () => {
    const chain = mockChain({ data: null, error: { message: "DB err" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/updateprofile")
      .send({ id: 1, title: "Dr", qualification: "MBBS" });

    expect(res.body.error).toBe("DB err");
  });
});
