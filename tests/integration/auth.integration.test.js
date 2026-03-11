const request = require("supertest");
const bcrypt = require("bcrypt");
const { mockChain } = require("../helpers/mockSupabase");

const mockFrom = jest.fn();
jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));

const app = require("../../src/app");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Auth integration – full HTTP cycle through app", () => {
  describe("POST /api/signup", () => {
    it("responds with 201 and JSON content-type", async () => {
      const chain = mockChain({ data: [{ u_id: 1 }], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).post("/api/signup").send({
        firstname: "Jane",
        lastname: "Smith",
        email: "jane@example.com",
        password: "pass123",
        gender: "Female",
        dob: "1995-06-15",
      });

      expect(res.status).toBe(201);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.message).toBe("User created successfully");
    });

    it("hashes the password before inserting", async () => {
      const chain = mockChain({ data: [{ u_id: 2 }], error: null });
      mockFrom.mockReturnValue(chain);

      await request(app).post("/api/signup").send({
        firstname: "A",
        lastname: "B",
        email: "ab@c.com",
        password: "plaintext",
        gender: "Male",
        dob: "2000-01-01",
      });

      const insertArg = chain.insert.mock.calls[0][0][0];
      expect(insertArg.u_password).not.toBe("plaintext");
      const match = await bcrypt.compare("plaintext", insertArg.u_password);
      expect(match).toBe(true);
    });

    it("returns 500 with error body on DB failure", async () => {
      const chain = mockChain({ data: null, error: { message: "dup" } });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).post("/api/signup").send({
        firstname: "X",
        lastname: "Y",
        email: "x@y.com",
        password: "p",
        gender: "Male",
        dob: "2000-01-01",
      });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/authenticate", () => {
    it("returns user array on successful login", async () => {
      const hashed = await bcrypt.hash("mypass", 10);
      const users = [{ u_id: 1, u_email: "u@e.com", u_password: hashed }];
      const chain = mockChain({ data: users, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/authenticate")
        .send({ email: "u@e.com", password: "mypass" });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].u_email).toBe("u@e.com");
    });

    it("returns message on wrong password", async () => {
      const hashed = await bcrypt.hash("right", 10);
      const chain = mockChain({
        data: [{ u_id: 1, u_password: hashed }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/authenticate")
        .send({ email: "u@e.com", password: "wrong" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Wrong email/password");
    });

    it("returns message when email not found", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/authenticate")
        .send({ email: "nope@x.com", password: "x" });

      expect(res.body.message).toBe("Email doesn't exist..");
    });
  });

  describe("POST /api/emailalreadyregistered", () => {
    it("returns message for existing email", async () => {
      const chain = mockChain({
        data: [{ u_email: "e@e.com" }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/emailalreadyregistered")
        .send({ email: "e@e.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Email already exists");
    });

    it("returns empty body for new email", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/emailalreadyregistered")
        .send({ email: "new@e.com" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });
  });

  describe("POST /api/getuser", () => {
    it("returns single user object", async () => {
      const user = { u_id: 5, u_firstname: "Test" };
      const chain = mockChain({ data: [user], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).post("/api/getuser").send({ id: 5 });

      expect(res.status).toBe(200);
      expect(res.body.u_id).toBe(5);
    });
  });

  describe("POST /api/forgotpassword", () => {
    it("returns user data when email found", async () => {
      const chain = mockChain({
        data: [{ u_id: 1, u_email: "a@b.com" }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/forgotpassword")
        .send({ email: "a@b.com" });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("returns message when email not found", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/forgotpassword")
        .send({ email: "x@y.com" });

      expect(res.body.message).toBe("Email not found");
    });
  });

  describe("POST /api/updatepassword", () => {
    it("responds with success message", async () => {
      const chain = mockChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/updatepassword")
        .send({ id: 1, password: "newpass" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Password updated successfully");
    });
  });

  describe("POST /api/updateprofile", () => {
    it("responds with success message", async () => {
      const chain = mockChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/updateprofile")
        .send({ id: 1, title: "Dr", qualification: "MD" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Profile updated successfully");
    });
  });
});
