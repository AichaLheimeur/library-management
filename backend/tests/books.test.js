const request = require("supertest");
const app = require("../index");
const pool = require("../src/config/db");

let adminToken;
let userToken;
let createdBookId;

// Variable au niveau du fichier pour le nettoyage
const userEmail = `booktest_${Date.now()}@test.com`;
const userPassword = "TestPassword123!";

beforeAll(async () => {
  // Connexion admin
  const adminRes = await request(app).post("/api/auth/login").send({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  adminToken = adminRes.body.token;

  // Création + connexion d'un utilisateur normal
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
  // Supprimer le livre créé pendant les tests
  if (createdBookId) {
    await pool.query("DELETE FROM books WHERE id = ?", [createdBookId]);
  }
  // Supprimer l'utilisateur test
  await pool.query("DELETE FROM users WHERE email = ?", [userEmail]);
  // Dernier fichier de test : fermer le pool
  await pool.end();
});

// ─────────────────────────────────────────
// GET /api/books
// ─────────────────────────────────────────
describe("GET /api/books", () => {
  it("should return 200 and an array (public route)", async () => {
    const res = await request(app).get("/api/books");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─────────────────────────────────────────
// GET /api/books/:id
// ─────────────────────────────────────────
describe("GET /api/books/:id", () => {
  it("should return 404 for a non-existent book", async () => {
    const res = await request(app).get("/api/books/99999");

    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────
// POST /api/books
// ─────────────────────────────────────────
describe("POST /api/books", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).post("/api/books").send({
      title: "Test Book",
      author: "Test Author",
    });

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 with a user token (not admin)", async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "Test Book",
        author: "Test Author",
      });

    expect(res.statusCode).toBe(403);
  });

  it("should return 400 if title is missing", async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        author: "Test Author",
      });

    expect(res.statusCode).toBe(400);
  });

  it("should create a book with an admin token", async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Book",
        author: "Test Author",
        category: "Tests",
        total_quantity: 2,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("title", "Test Book");
    expect(res.body).toHaveProperty("author", "Test Author");
    expect(res.body).toHaveProperty("available_quantity", 2);

    // Sauvegarder l'id pour nettoyage dans afterAll
    createdBookId = res.body.id;
  });
});

// ─────────────────────────────────────────
// DELETE /api/books/:id
// ─────────────────────────────────────────
describe("DELETE /api/books/:id", () => {
  it("should return 403 with a user token", async () => {
    const res = await request(app)
      .delete(`/api/books/${createdBookId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });
});
