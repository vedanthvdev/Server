const request = require("supertest");
const { mockChain } = require("../helpers/mockSupabase");

const mockFrom = jest.fn();
jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));

const app = require("../../src/app");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("E2E: Job lifecycle – register -> list -> click -> delete", () => {
  const jobPayload = {
    title: "Cardiologist",
    company: "Heart Hospital",
    location: "Mumbai",
    job_type: "Full-time",
    apply_link: "https://heart.hospital/apply",
    date: "2026-03-11",
    contact: '[{"email":"hr@heart.hospital"}]',
    userId: 42,
    jobSalary: "250000",
  };

  it("registers a new job", async () => {
    const chain = mockChain({ data: [{ j_id: 100 }], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/registerjob").send(jobPayload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Job registered successfully");

    const inserted = chain.insert.mock.calls[0][0][0];
    expect(inserted.j_title).toBe("Cardiologist");
    expect(inserted.j_company).toBe("Heart Hospital");
    expect(inserted.j_u_id).toBe(42);
  });

  it("lists all jobs and finds the registered job", async () => {
    const jobs = [
      { j_id: 100, j_title: "Cardiologist", j_company: "Heart Hospital" },
      { j_id: 101, j_title: "Nurse", j_company: "Clinic" },
    ];
    const chain = mockChain({ data: jobs, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getjobs");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    const cardio = res.body.find((j) => j.j_id === 100);
    expect(cardio.j_title).toBe("Cardiologist");
  });

  it("shows up in recent jobs", async () => {
    const jobs = [
      { j_id: 100, j_title: "Cardiologist", j_company: "Heart Hospital" },
    ];
    const chain = mockChain({ data: jobs, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).get("/api/getrecentjobs");

    expect(res.status).toBe(200);
    expect(chain.order).toHaveBeenCalledWith("j_date", { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it("shows up in user uploaded jobs", async () => {
    const jobs = [{ j_id: 100, j_title: "Cardiologist" }];
    const chain = mockChain({ data: jobs, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/getuseruploadedjobs")
      .send({ userId: 42 });

    expect(res.status).toBe(200);
    expect(res.body[0].j_title).toBe("Cardiologist");
    expect(chain.eq).toHaveBeenCalledWith("j_u_id", 42);
  });

  it("increments click count on the job", async () => {
    const selectChain = mockChain({ data: [{ j_click: 0 }], error: null });
    const updateChain = mockChain({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : updateChain;
    });

    const res = await request(app).post("/api/updateclick").send({ id: 100 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("click ++");
    expect(updateChain.update).toHaveBeenCalledWith({ j_click: 1 });
  });

  it("deletes the job", async () => {
    const chain = mockChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/deletejob")
      .send({ jobId: 100 });

    expect(res.status).toBe(200);
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("j_id", 100);
  });

  it("returns 404 after job is deleted (user has no jobs)", async () => {
    const chain = mockChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .post("/api/getuseruploadedjobs")
      .send({ userId: 42 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No jobs found");
  });
});

describe("E2E: Job registration failure", () => {
  it("returns 500 when DB insert fails", async () => {
    const chain = mockChain({ data: null, error: { message: "constraint" } });
    mockFrom.mockReturnValue(chain);

    const res = await request(app).post("/api/registerjob").send({
      title: "X",
      company: "Y",
      location: "Z",
      job_type: "Full-time",
      apply_link: "https://x.com",
      date: "2026-01-01",
      contact: "[]",
      userId: 1,
      jobSalary: "0",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Unable to register job");
  });
});
