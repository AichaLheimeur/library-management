const request = require("supertest");
const app = require("../index");
const pool = require("../src/config/db");

let adminToken;
let userToken;
let testBookId;
let loanId;

const userEmail = `loantest_${Date.now()}@test.com`;
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

  // Création d'un livre test avec 1 exemplaire disponible
  const bookRes = await request(app)
    .post("/api/books")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: "Loan Test Book",
      author: "Test Author",
      total_quantity: 1,
    });
  testBookId = bookRes.body.id;
});

afterAll(async () => {
  // La suppression du livre cascade les loans et les pénalités (ON DELETE CASCADE)
  if (testBookId) {
    await pool.query("DELETE FROM books WHERE id = ?", [testBookId]);
  }
  // La suppression du user cascade aussi ses loans restants
  await pool.query("DELETE FROM users WHERE email = ?", [userEmail]);
});

// ─────────────────────────────────────────
// POST /api/loans
// ─────────────────────────────────────────
describe("POST /api/loans", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).post("/api/loans").send({ book_id: testBookId });

    expect(res.statusCode).toBe(401);
  });

  it("should return 400 if book_id is missing", async () => {
    const res = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it("should return 404 for a non-existent book", async () => {
    const res = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: 99999 });

    expect(res.statusCode).toBe(404);
  });

  it("should borrow a book successfully", async () => {
    const res = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: testBookId });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Book borrowed successfully");
  });

  it("should return 400 when book is no longer available (stock = 0)", async () => {
    // Le livre a été emprunté dans le test précédent, stock = 0
    const res = await request(app)
      .post("/api/loans")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: testBookId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Book not available");
  });
});

// ─────────────────────────────────────────
// GET /api/loans/me
// ─────────────────────────────────────────
describe("GET /api/loans/me", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/loans/me");

    expect(res.statusCode).toBe(401);
  });

  it("should return 200 and an array of loans", async () => {
    const res = await request(app)
      .get("/api/loans/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Récupérer l'id du loan pour les tests de retour
    loanId = res.body[0].id;
  });
});

// ─────────────────────────────────────────
// GET /api/loans (admin)
// ─────────────────────────────────────────
describe("GET /api/loans", () => {
  it("should return 403 with a user token", async () => {
    const res = await request(app)
      .get("/api/loans")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return 200 and all loans with admin token", async () => {
    const res = await request(app)
      .get("/api/loans")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─────────────────────────────────────────
// PUT /api/loans/:id/return
// ─────────────────────────────────────────
describe("PUT /api/loans/:id/return", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).put(`/api/loans/${loanId}/return`);

    expect(res.statusCode).toBe(401);
  });

  it("should return 404 for a non-existent loan", async () => {
    const res = await request(app)
      .put("/api/loans/99999/return")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
  });

  it("should return the book successfully", async () => {
    const res = await request(app)
      .put(`/api/loans/${loanId}/return`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it("should return 400 on double return attempt", async () => {
    const res = await request(app)
      .put(`/api/loans/${loanId}/return`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Book already returned");
  });
});
