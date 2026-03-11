const { mockChain } = require("../helpers/mockSupabase");

const mockFrom = jest.fn();
jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));

const jobsRouter = require("../../src/routes/jobs");

const express = require("express");
const app = express();
app.use(express.json());
app.use("/api", jobsRouter);

const request = require("supertest");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/registerjob", () => {
  it("inserts a job and returns 201", async () => {
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

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: { message: "fail" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/registerjob").send({
      title: "Surgeon",
      company: "Hospital A",
      location: "London",
      job_type: "Full-time",
      apply_link: "https://example.com",
      date: "2026-03-11",
      contact: "[]",
      userId: 1,
      jobSalary: "100000",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Unable to register job");
  });
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

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: new Error("DB error") });
    chain.then = () => {
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

  it("returns 404 when no recent jobs", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getrecentjobs");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No jobs found");
  });

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: new Error("DB") });
    chain.then = () => {
      throw new Error("DB");
    };
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getrecentjobs");

    expect(res.status).toBe(500);
  });
});

describe("POST /api/getuseruploadedjobs", () => {
  it("returns jobs for a user", async () => {
    const jobs = [{ j_id: 1, j_title: "Doc" }];
    const chain = mockChain({ data: jobs, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/getuseruploadedjobs")
      .send({ userId: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(jobs);
    expect(chain.eq).toHaveBeenCalledWith("j_u_id", 5);
  });

  it("returns 404 when user has no jobs", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/getuseruploadedjobs")
      .send({ userId: 99 });

    expect(res.status).toBe(404);
  });

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: new Error("DB") });
    chain.then = () => {
      throw new Error("DB");
    };
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/getuseruploadedjobs")
      .send({ userId: 1 });

    expect(res.status).toBe(500);
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

  it("returns 500 on DB error", async () => {
    const chain = mockChain({ data: null, error: new Error("DB") });
    chain.then = () => {
      throw new Error("DB");
    };
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/deletejob").send({ jobId: 1 });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/updateclick", () => {
  it("increments click count for a job", async () => {
    const selectChain = mockChain({ data: [{ j_click: 5 }], error: null });
    const updateChain = mockChain({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : updateChain;
    });

    const res = await request(app).post("/api/updateclick").send({ id: 10 });

    expect(res.body.message).toBe("click ++");
    expect(updateChain.update).toHaveBeenCalledWith({ j_click: 6 });
  });

  it("returns error on update failure", async () => {
    const selectChain = mockChain({ data: [{ j_click: 3 }], error: null });
    const updateChain = mockChain({ data: null, error: { message: "fail" } });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : updateChain;
    });

    const res = await request(app).post("/api/updateclick").send({ id: 10 });

    expect(res.body.error).toBe("fail");
  });
});
