const request = require("supertest");
const app = require("../index");
const pool = require("../src/config/db");

let adminToken;
let userToken;
let userId;

const userEmail = `pointstest_${Date.now()}@test.com`;
const userPassword = "TestPassword123!";

beforeAll(async () => {
  // Connexion admin
  const adminRes = await request(app).post("/api/auth/login").send({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  adminToken = adminRes.body.token;

  // Création + validation + connexion d'un user test
  await request(app).post("/api/auth/register").send({
    email: userEmail,
    password: userPassword,
  });
  await pool.query("UPDATE users SET is_validated = TRUE WHERE email = ?", [userEmail]);
  const userRes = await request(app).post("/api/auth/login").send({
    email: userEmail,
    password: userPassword,
  });
  userToken = userRes.body.token;

  // Récupérer l'ID du user test
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [userEmail]);
  userId = rows[0].id;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = ?", [userEmail]);
});

// ─────────────────────────────────────────
// PUT /api/users/:id/points (admin)
// ─────────────────────────────────────────
describe("PUT /api/users/:id/points", () => {
  it("should return 401 without token", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/points`)
      .send({ points: 50, reason: "Test" });

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 with a user token", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/points`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ points: 50, reason: "Test" });

    expect(res.statusCode).toBe(403);
  });

  it("should adjust points successfully with admin token", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/points`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ points: 50, reason: "Admin adjustment test" });

    expect(res.statusCode).toBe(200);
    expect(res.body.points).toBe(50);
  });

  it("should lift suspension when points set above 0", async () => {
    // First set to 0 (suspended)
    await pool.query(
      "UPDATE users SET points = 0, points_blocked_until = DATE_ADD(NOW(), INTERVAL 15 DAY) WHERE id = ?",
      [userId]
    );

    // Then adjust to 50
    const res = await request(app)
      .put(`/api/users/${userId}/points`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ points: 50, reason: "Lift suspension" });

    expect(res.statusCode).toBe(200);
    expect(res.body.points).toBe(50);
    expect(res.body.blockedUntil).toBeNull();
  });
});

// ─────────────────────────────────────────
// GET /api/users/:id/points-log (admin)
// ─────────────────────────────────────────
describe("GET /api/users/:id/points-log", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).get(`/api/users/${userId}/points-log`);

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 with a user token", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/points-log`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return points log with admin token", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/points-log`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────
// Points system on return (via loans)
// ─────────────────────────────────────────
describe("Points on book return", () => {
  let testBookId;
  let loanId;

  beforeAll(async () => {
    // Créer un livre test
    const bookRes = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Points Test Book", author: "Test Author", total_quantity: 1 });
    testBookId = bookRes.body.id;

    // Emprunter le livre
    await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: testBookId });

    // Récupérer le loan
    const loansRes = await request(app)
      .get("/api/loans/me")
      .set("Authorization", `Bearer ${userToken}`);
    loanId = loansRes.body.find(l => l.book_id === testBookId)?.id;
  });

  afterAll(async () => {
    if (testBookId) {
      await pool.query("DELETE FROM books WHERE id = ?", [testBookId]);
    }
  });

  it("should earn +10 points on time return", async () => {
    // Récupérer les points avant retour
    const [rows] = await pool.query("SELECT points FROM users WHERE id = ?", [userId]);
    const pointsBefore = rows[0].points;

    const res = await request(app)
      .put(`/api/loans/${loanId}/return`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.pointsChange).toBe(10);
    expect(res.body.points).toBe(pointsBefore + 10);
  });
});

// ─────────────────────────────────────────
// Suspension check
// ─────────────────────────────────────────
describe("Suspension at 0 points", () => {
  let testBookId;

  beforeAll(async () => {
    // Suspendre le user
    await pool.query(
      "UPDATE users SET points = 0, points_blocked_until = DATE_ADD(NOW(), INTERVAL 15 DAY) WHERE id = ?",
      [userId]
    );

    const bookRes = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Suspension Test Book", author: "Test Author", total_quantity: 1 });
    testBookId = bookRes.body.id;
  });

  afterAll(async () => {
    if (testBookId) {
      await pool.query("DELETE FROM books WHERE id = ?", [testBookId]);
    }
    // Lever la suspension
    await pool.query(
      "UPDATE users SET points = 100, points_blocked_until = NULL WHERE id = ?",
      [userId]
    );
  });

  it("should return 403 when trying to borrow while suspended", async () => {
    const res = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: testBookId });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("suspended");
  });
});
