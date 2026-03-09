const request = require("supertest");
const app = require("../index");
const pool = require("../src/config/db");

// Email unique à chaque exécution pour ne pas polluer la base
const testEmail = `test_${Date.now()}@test.com`;
const testPassword = "TestPassword123!";

afterAll(async () => {
  // Nettoyage : supprimer l'utilisateur créé pendant les tests
  await pool.query("DELETE FROM users WHERE email = ?", [testEmail]);
});

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("should register a new user and return a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("should return 400 if email is already used", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("should return 400 if email or password is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: testEmail,
    });

    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
describe("POST /api/auth/login", () => {
  it("should login and return a token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("should return 401 with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it("should return 401 with unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: testPassword,
    });

    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
describe("GET /api/auth/me", () => {
  let token;

  beforeAll(async () => {
    // Récupérer un token valide avant les tests de ce groupe
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });
    token = res.body.token;
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.statusCode).toBe(401);
  });

  it("should return the user profile with a valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
  });
});
