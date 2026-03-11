const request = require("supertest");
const { mockChain } = require("../helpers/mockSupabase");

const mockFrom = jest.fn();
jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));

const app = require("../../src/app");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Jobs integration – full HTTP cycle through app", () => {
  describe("POST /api/registerjob", () => {
    it("responds with 201 and JSON", async () => {
      const chain = mockChain({ data: [{ j_id: 1 }], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).post("/api/registerjob").send({
        title: "Nurse",
        company: "Clinic B",
        location: "NYC",
        job_type: "Part-time",
        apply_link: "https://example.com",
        date: "2026-03-11",
        contact: "[]",
        userId: 2,
        jobSalary: "80000",
      });

      expect(res.status).toBe(201);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body.message).toBe("Job registered successfully");
    });

    it("returns 500 on DB error", async () => {
      const chain = mockChain({ data: null, error: { message: "err" } });
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
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/getjobs", () => {
    it("returns 200 with array of jobs", async () => {
      const jobs = [{ j_id: 1, j_title: "Doc" }];
      const chain = mockChain({ data: jobs, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).get("/api/getjobs");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(jobs);
    });

    it("returns 404 when empty", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).get("/api/getjobs");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/getrecentjobs", () => {
    it("returns 200 with ordered jobs", async () => {
      const jobs = [{ j_id: 3, j_title: "Recent" }];
      const chain = mockChain({ data: jobs, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).get("/api/getrecentjobs");

      expect(res.status).toBe(200);
      expect(chain.order).toHaveBeenCalledWith("j_date", { ascending: false });
      expect(chain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe("POST /api/getuseruploadedjobs", () => {
    it("returns jobs for given user", async () => {
      const jobs = [{ j_id: 1 }];
      const chain = mockChain({ data: jobs, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/getuseruploadedjobs")
        .send({ userId: 3 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(jobs);
    });

    it("returns 404 when user has no jobs", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/getuseruploadedjobs")
        .send({ userId: 99 });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/deletejob", () => {
    it("deletes and responds with 200", async () => {
      const chain = mockChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).post("/api/deletejob").send({ jobId: 7 });

      expect(res.status).toBe(200);
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("j_id", 7);
    });
  });

  describe("POST /api/updateclick", () => {
    it("increments click and responds with message", async () => {
      const selectChain = mockChain({ data: [{ j_click: 10 }], error: null });
      const updateChain = mockChain({ data: null, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectChain : updateChain;
      });

      const res = await request(app).post("/api/updateclick").send({ id: 5 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("click ++");
      expect(updateChain.update).toHaveBeenCalledWith({ j_click: 11 });
    });
  });
});
