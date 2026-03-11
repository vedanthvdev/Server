const request = require("supertest");
const bcrypt = require("bcrypt");

const mockFrom = jest.fn();
const mockCreateClient = jest.fn(() => ({ from: mockFrom }));

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

const app = require("../server_v2");

function mockChain(resolvedValue) {
  const chain = {};
  const methods = ["select", "insert", "update", "delete", "eq", "limit", "order"];
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve) => resolve(resolvedValue);
  chain.catch = jest.fn(() => chain);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/getjobs", () => {
  it("returns all jobs", async () => {
    const jobs = [
      { j_id: 1, j_title: "Surgeon", j_company: "Hospital A" },
      { j_id: 2, j_title: "Nurse", j_company: "Hospital B" },
    ];
    const chain = mockChain({ data: jobs, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getjobs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(jobs);
    expect(mockFrom).toHaveBeenCalledWith("jobs");
  });

  it("returns 404 when no jobs found", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getjobs");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No jobs found");
  });

  it("returns 500 on database error", async () => {
    const chain = mockChain({ data: null, error: new Error("DB error") });
    chain.then = (resolve, reject) => {
      throw new Error("DB error");
    };
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getjobs");

    expect(res.status).toBe(500);
  });
});

describe("GET /api/getrecentjobs", () => {
  it("returns the 10 most recent jobs", async () => {
    const jobs = [{ j_id: 1, j_title: "Dentist" }];
    const chain = mockChain({ data: jobs, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getrecentjobs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(jobs);
    expect(chain.order).toHaveBeenCalledWith("j_date", { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(10);
  });
});

describe("POST /api/signup", () => {
  it("creates a new user with hashed password", async () => {
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

  it("returns 500 when signup fails", async () => {
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

  it("returns empty object when email does not exist", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/emailalreadyregistered")
      .send({ email: "new@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
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
});

describe("POST /api/registerjob", () => {
  it("creates a new job listing", async () => {
    const chain = mockChain({ data: [{ j_id: 1 }], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/registerjob").send({
      title: "Surgeon",
      company: "Hospital A",
      location: "London",
      job_type: "Full-time",
      apply_link: "https://example.com",
      date: "2026-03-11",
      contact: '[{"phone":"123"}]',
      userId: 1,
      jobSalary: "100000",
    });

    expect(mockFrom).toHaveBeenCalledWith("jobs");
    expect(chain.insert).toHaveBeenCalled();
    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.j_title).toBe("Surgeon");
    expect(insertArg.j_company).toBe("Hospital A");
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Job registered successfully");
  });
});

describe("POST /api/deletejob", () => {
  it("deletes a job by id", async () => {
    const chain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/deletejob").send({ jobId: 1 });

    expect(mockFrom).toHaveBeenCalledWith("jobs");
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("j_id", 1);
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
});
