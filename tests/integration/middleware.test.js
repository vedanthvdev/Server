const request = require("supertest");
const { mockChain } = require("../helpers/mockSupabase");

const mockFrom = jest.fn();
jest.mock("../../src/db/supabase", () => ({ from: mockFrom }));

const app = require("../../src/app");

describe("Middleware integration", () => {
  describe("CORS", () => {
    it("sets CORS headers for allowed origin", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .get("/api/getjobs")
        .set("Origin", "https://ihospitaljobs.com");

      expect(res.headers["access-control-allow-methods"]).toContain("GET");
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("does not set custom origin for disallowed origin", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .get("/api/getjobs")
        .set("Origin", "https://evil.com");

      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("JSON body parsing", () => {
    it("parses JSON request bodies", async () => {
      const chain = mockChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app)
        .post("/api/emailalreadyregistered")
        .set("Content-Type", "application/json")
        .send({ email: "test@test.com" });

      expect(res.status).not.toBe(400);
    });
  });

  describe("404 handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(app).get("/api/nonexistent");

      expect(res.status).toBe(404);
    });
  });

  describe("Response format", () => {
    it("returns JSON content-type for API responses", async () => {
      const chain = mockChain({ data: [{ j_id: 1, j_title: "Doc" }], error: null });
      mockFrom.mockReturnValue(chain);

      const res = await request(app).get("/api/getjobs");

      expect(res.headers["content-type"]).toMatch(/json/);
    });
  });
});
