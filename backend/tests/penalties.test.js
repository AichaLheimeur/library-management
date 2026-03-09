const request = require("supertest");
const app = require("../index");
const pool = require("../src/config/db");

let adminToken;
let userToken;

const userEmail = `penaltytest_${Date.now()}@test.com`;
const userPassword = "TestPassword123!";

beforeAll(async () => {
  // Connexion admin
  const adminRes = await request(app).post("/api/auth/login").send({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  adminToken = adminRes.body.token;

  // Création + connexion d'un user test
  await request(app).post("/api/auth/register").send({
    email: userEmail,
    password: userPassword,
  });
  const userRes = await request(app).post("/api/auth/login").send({
    email: userEmail,
    password: userPassword,
  });
  userToken = userRes.body.token;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = ?", [userEmail]);
});

// ─────────────────────────────────────────
// GET /api/penalties/me
// ─────────────────────────────────────────
describe("GET /api/penalties/me", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/penalties/me");

    expect(res.statusCode).toBe(401);
  });

  it("should return 200 and an array with user token", async () => {
    const res = await request(app)
      .get("/api/penalties/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─────────────────────────────────────────
// GET /api/penalties (admin)
// ─────────────────────────────────────────
describe("GET /api/penalties", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/penalties");

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 with a user token", async () => {
    const res = await request(app)
      .get("/api/penalties")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return 200 and all penalties with admin token", async () => {
    const res = await request(app)
      .get("/api/penalties")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
